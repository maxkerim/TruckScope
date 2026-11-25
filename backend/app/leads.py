import os
import sqlite3
import time
from collections import defaultdict
from contextlib import closing
from pathlib import Path
from typing import Optional

import httpx
from fastapi import APIRouter, Header, HTTPException, Query, Request
from pydantic import BaseModel, Field

router = APIRouter()

TG_BOT_TOKEN = os.environ.get("TG_BOT_TOKEN", "")
TG_CHAT_ID = os.environ.get("TG_CHAT_ID", "")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")

DB_PATH = Path(os.environ.get("DB_PATH", "/app/data/leads.db"))
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

STATUSES = [
    "new",
    "contacted",
    "sent_to_company",
    "started_work",
    "paid",
    "rejected",
    "no_answer",
]

_hits = defaultdict(list)


def db():
    conn = sqlite3.connect(str(DB_PATH), timeout=15)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with closing(db()) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT DEFAULT (datetime('now')),
                name TEXT NOT NULL,
                contact TEXT NOT NULL,
                cdl TEXT,
                experience TEXT,
                state TEXT,
                priority TEXT,
                language TEXT,
                source TEXT,
                company_interest TEXT,
                consent INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'new',
                company_sent_to TEXT,
                payout_usd INTEGER,
                notes TEXT
            )
        """)
        conn.commit()


init_db()


class Lead(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    contact: str = Field(min_length=5, max_length=80)
    cdl: Optional[str] = Field(default=None, max_length=20)
    experience: Optional[str] = Field(default=None, max_length=30)
    state: Optional[str] = Field(default=None, max_length=30)
    priority: Optional[str] = Field(default=None, max_length=60)
    language: Optional[str] = Field(default=None, max_length=5)
    source: Optional[str] = Field(default=None, max_length=40)
    company_interest: Optional[str] = Field(default=None, max_length=120)
    consent: bool = False
    website: Optional[str] = Field(default=None, max_length=200)


class StatusUpdate(BaseModel):
    status: str
    company_sent_to: Optional[str] = Field(default=None, max_length=120)
    payout_usd: Optional[int] = Field(default=None, ge=0, le=1000000)
    notes: Optional[str] = Field(default=None, max_length=2000)


def rate_limit(ip: str, limit: int = 5, window: int = 600):
    now = time.time()
    _hits[ip] = [hit for hit in _hits[ip] if now - hit < window]

    if len(_hits[ip]) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests")

    _hits[ip].append(now)


def check_admin(token: Optional[str]):
    if not ADMIN_TOKEN or not token or token != ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


def esc(value: Optional[str]) -> str:
    return (
        (value or "-")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


async def notify_telegram(lead_id: int, lead: Lead):
    if not TG_BOT_TOKEN or not TG_CHAT_ID:
        raise RuntimeError("Telegram credentials are not configured")

    message = (
        f"🚛 <b>Новая заявка #{lead_id}</b>\n\n"
        f"👤 {esc(lead.name)}\n"
        f"📞 {esc(lead.contact)}\n"
        f"🪪 CDL: {esc(lead.cdl)} | Опыт: {esc(lead.experience)}\n"
        f"📍 Штат: {esc(lead.state)}\n"
        f"🎯 Важно: {esc(lead.priority)}\n"
        f"🌐 Язык: {esc(lead.language)} | Источник: {esc(lead.source)}\n"
        f"🏢 Интерес: {esc(lead.company_interest)}\n\n"
        "Позвони или напиши в течение часа."
    )

    url = f"https://api.telegram.org/bot{TG_BOT_TOKEN}/sendMessage"

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            url,
            json={
                "chat_id": TG_CHAT_ID,
                "text": message,
                "parse_mode": "HTML",
            },
        )
        response.raise_for_status()


@router.post("/api/lead")
async def create_lead(lead: Lead, request: Request):
    ip = request.client.host if request.client else "unknown"
    rate_limit(ip)

    if lead.website:
        return {"ok": True}

    if not lead.consent:
        raise HTTPException(status_code=400, detail="Consent is required")

    with closing(db()) as conn:
        cursor = conn.execute(
            """
            INSERT INTO leads (
                name, contact, cdl, experience, state, priority,
                language, source, company_interest, consent
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
            """,
            (
                lead.name,
                lead.contact,
                lead.cdl,
                lead.experience,
                lead.state,
                lead.priority,
                lead.language,
                lead.source,
                lead.company_interest,
            ),
        )
        conn.commit()
        lead_id = cursor.lastrowid

    try:
        await notify_telegram(lead_id, lead)
    except Exception as error:
        # Заявка уже сохранена. Ошибка Telegram не удаляет её.
        print(f"Telegram notification failed for lead {lead_id}: {type(error).__name__}")

    return {"ok": True, "id": lead_id}


@router.get("/api/leads")
def list_leads(
    status: Optional[str] = Query(default=None),
    x_admin_token: Optional[str] = Header(default=None),
):
    check_admin(x_admin_token)

    if status and status not in STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")

    with closing(db()) as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM leads WHERE status = ? ORDER BY id DESC",
                (status,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM leads ORDER BY id DESC"
            ).fetchall()

    return [dict(row) for row in rows]


@router.patch("/api/leads/{lead_id}")
def update_lead(
    lead_id: int,
    upd: StatusUpdate,
    x_admin_token: Optional[str] = Header(default=None),
):
    check_admin(x_admin_token)

    if upd.status not in STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of {STATUSES}",
        )

    with closing(db()) as conn:
        cursor = conn.execute(
            """
            UPDATE leads
            SET status = ?,
                company_sent_to = COALESCE(?, company_sent_to),
                payout_usd = COALESCE(?, payout_usd),
                notes = COALESCE(?, notes)
            WHERE id = ?
            """,
            (
                upd.status,
                upd.company_sent_to,
                upd.payout_usd,
                upd.notes,
                lead_id,
            ),
        )
        conn.commit()

        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Lead not found")

    return {"ok": True}
