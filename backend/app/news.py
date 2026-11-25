from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from html import unescape
from concurrent.futures import ThreadPoolExecutor
from hashlib import sha256
import os
import re
import xml.etree.ElementTree as ET

import requests
from fastapi import APIRouter, Query
from sqlalchemy import text

from app.database import engine

router = APIRouter()

NEWS_FEEDS = [
    ("Transport Topics", "https://www.ttnews.com/rss.xml"),
    ("FreightWaves", "https://www.freightwaves.com/feed"),
    ("Truckers News", "https://truckersnews.com/feed"),
    ("CDL Life", "https://cdllife.com/feed"),
]

CATEGORY_TERMS = {
    "drivers": [
        "driver", "owner-operator", "owner operator", "truckers", "cdl",
        "driver shortage", "parking", "life on the road", "driver pay",
    ],
    "regulations": [
        "fmcsa", "regulation", "regulatory", "rule", "compliance",
        "dot", "hours of service", "hos", "eld mandate", "inspection",
        "congress", "lawmakers", "epa",
    ],
    "safety": [
        "crash", "accident", "collision", "fatal", "safety", "recall",
        "braking", "inspection", "road closure", "weather",
    ],
    "freight": [
        "freight", "truckload", "spot rate", "load", "broker",
        "shipping", "logistics", "capacity", "supply chain", "port",
        "intermodal", "rate",
    ],
    "technology": [
        "technology", "software", "telematics", "electric truck",
        "autonomous", "artificial intelligence", " ai ", "gps",
        "fleet management", "camera", "digital",
    ],
    "fuel": [
        "diesel", "fuel", "gas price", "gasoline", "highway",
        "road", "bridge", "infrastructure", "parking", "toll",
        "weather", "snow", "storm",
    ],
}


def ensure_translation_tables():
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS news_translation_cache (
                cache_key VARCHAR(64) PRIMARY KEY,
                translated_text TEXT NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """))

        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS news_translation_usage (
                usage_date DATE PRIMARY KEY,
                characters_used INTEGER NOT NULL DEFAULT 0
            )
        """))


def clean_text(value):
    if not value:
        return ""
    value = re.sub(r"<[^>]+>", " ", value)
    value = unescape(value)
    return re.sub(r"\s+", " ", value).strip()


def get_item_text(item, names):
    for name in names:
        node = item.find(name)
        if node is not None:
            value = node.text or ""
            if value.strip():
                return value.strip()
    return ""


def parse_date(value):
    if not value:
        return None
    try:
        parsed = parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed.isoformat()
    except Exception:
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
            return parsed.isoformat()
        except Exception:
            return None


def translate_text(value, language):
    original = clean_text(value)
    if not original or language not in {"ru", "es"}:
        return original

    # MyMemory допускает максимум 500 байт на запрос.
    request_text = original.encode("utf-8")[:450].decode(
        "utf-8", errors="ignore"
    ).strip()

    if not request_text:
        return original

    cache_key = sha256(
        f"{language}:{request_text}".encode("utf-8")
    ).hexdigest()

    with engine.connect() as conn:
        cached = conn.execute(
            text("""
                SELECT translated_text
                FROM news_translation_cache
                WHERE cache_key = :cache_key
            """),
            {"cache_key": cache_key},
        ).scalar_one_or_none()

    if cached:
        return cached

    email = os.getenv("MYMEMORY_EMAIL", "").strip()
    daily_limit = 45000 if email else 4500
    character_count = len(request_text)

    # Резервируем дневной лимит до обращения к API.
    with engine.begin() as conn:
        reserved = conn.execute(
            text("""
                INSERT INTO news_translation_usage
                    (usage_date, characters_used)
                VALUES (CURRENT_DATE, :amount)
                ON CONFLICT (usage_date)
                DO UPDATE SET
                    characters_used =
                        news_translation_usage.characters_used
                        + EXCLUDED.characters_used
                WHERE news_translation_usage.characters_used
                    + EXCLUDED.characters_used <= :daily_limit
                RETURNING characters_used
            """),
            {
                "amount": character_count,
                "daily_limit": daily_limit,
            },
        ).scalar_one_or_none()

    if reserved is None:
        return original

    try:
        params = {
            "q": request_text,
            "langpair": f"en|{language}",
        }
        if email:
            params["de"] = email

        response = requests.get(
            "https://api.mymemory.translated.net/get",
            params=params,
            timeout=8,
        )
        response.raise_for_status()

        data = response.json()

        if data.get("responseStatus") != 200:
            return original

        translated = clean_text(
            data.get("responseData", {}).get("translatedText", "")
        )

        if not translated:
            return original

        with engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO news_translation_cache
                        (cache_key, translated_text)
                    VALUES (:cache_key, :translated)
                    ON CONFLICT (cache_key)
                    DO NOTHING
                """),
                {
                    "cache_key": cache_key,
                    "translated": translated,
                },
            )

        return translated

    except Exception as error:
        print(f"News translation unavailable ({language}): {error}")
        return original


def translate_article(article, language):
    result = dict(article)
    result["title_en"] = article["title"]
    result["summary_en"] = article["summary"]

    result["title"] = translate_text(article["title"], language)
    result["summary"] = translate_text(article["summary"], language)

    return result


def parse_feed(source, url):
    response = requests.get(
        url,
        timeout=12,
        headers={"User-Agent": "TruckScope News Reader/1.0"},
    )
    response.raise_for_status()
    root = ET.fromstring(response.content)
    items = root.findall(".//item")

    if not items:
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        items = root.findall(".//atom:entry", ns)

    articles = []

    for item in items[:100]:
        title = clean_text(
            get_item_text(
                item,
                ["title", "{http://www.w3.org/2005/Atom}title"],
            )
        )

        link = get_item_text(item, ["link"])

        if not link:
            link_node = item.find(
                "{http://www.w3.org/2005/Atom}link"
            )
            if link_node is not None:
                link = link_node.attrib.get("href", "")

        summary = get_item_text(
            item,
            [
                "description",
                "summary",
                "{http://www.w3.org/2005/Atom}summary",
                "{http://www.w3.org/2005/Atom}content",
            ],
        )

        published = get_item_text(
            item,
            [
                "pubDate",
                "published",
                "updated",
                "{http://www.w3.org/2005/Atom}published",
                "{http://www.w3.org/2005/Atom}updated",
            ],
        )

        if not title or not link or not link.startswith(
            ("https://", "http://")
        ):
            continue

        articles.append({
            "title": title[:400],
            "summary": clean_text(summary)[:500],
            "link": link,
            "published": parse_date(published),
            "source": source,
        })

    return articles


@router.get("/api/news")
def get_news(
    category: str = Query(default="all"),
    limit: int = Query(default=15, ge=1, le=15),
    language: str = Query(default="EN"),
):
    if category not in {"all", *CATEGORY_TERMS.keys()}:
        category = "all"

    language = language.upper()
    if language not in {"EN", "ES", "RU"}:
        language = "EN"

    articles = []
    feed_errors = []

    for source, url in NEWS_FEEDS:
        try:
            articles.extend(parse_feed(source, url))
        except Exception as error:
            feed_errors.append(source)
            print(f"News feed unavailable ({source}): {error}")

    seen = set()
    unique = []

    for article in articles:
        key = article["link"].split("#")[0].rstrip("/")
        if key in seen:
            continue
        seen.add(key)
        unique.append(article)

    if category != "all":
        terms = CATEGORY_TERMS[category]

        def matches(article):
            content = (
                f'{article["title"]} {article["summary"]}'
            ).lower()
            return any(term in content for term in terms)

        unique = [article for article in unique if matches(article)]

    unique.sort(
        key=lambda article: article["published"] or "",
        reverse=True,
    )

    selected = unique[:limit]

    if language in {"RU", "ES"}:
        try:
            ensure_translation_tables()
            target_language = language.lower()

            with ThreadPoolExecutor(max_workers=5) as executor:
                selected = list(
                    executor.map(
                        lambda article: translate_article(
                            article, target_language
                        ),
                        selected,
                    )
                )
        except Exception as error:
            print(f"News translation system unavailable: {error}")

    return {
        "articles": selected,
        "feeds_checked": len(NEWS_FEEDS),
        "feeds_unavailable": feed_errors,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "language": language,
    }
