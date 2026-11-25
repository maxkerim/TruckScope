from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine


# Условия допуска компании в публичный каталог
PUBLIC_COMPANY_FILTER = """
    catalog_status = 'approved'
    AND truck_count BETWEEN 6 AND 1900
    AND power_units BETWEEN 6 AND 1900
    AND total_drivers >= 6
    AND status_code = 'A'
    AND classdef ILIKE '%AUTHORIZED FOR HIRE%'
    AND carship ILIKE '%C%'
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    with engine.begin() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS companies (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                usdot_number VARCHAR(30) UNIQUE,
                city VARCHAR(100),
                state VARCHAR(2),
                truck_count INTEGER,
                authority_status VARCHAR(50),
                insurance_status VARCHAR(50)
            )
        """))

        conn.execute(text("""
            ALTER TABLE companies
            ADD COLUMN IF NOT EXISTS dba_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS power_units INTEGER,
            ADD COLUMN IF NOT EXISTS total_drivers INTEGER,
            ADD COLUMN IF NOT EXISTS classdef TEXT,
            ADD COLUMN IF NOT EXISTS carship VARCHAR(50),
            ADD COLUMN IF NOT EXISTS fmcsa_entity_status VARCHAR(10),
            ADD COLUMN IF NOT EXISTS mcs150_date VARCHAR(30),
            ADD COLUMN IF NOT EXISTS data_source VARCHAR(100),
            ADD COLUMN IF NOT EXISTS fmcsa_imported_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS catalog_status VARCHAR(30)
                DEFAULT 'needs_review',
            ADD COLUMN IF NOT EXISTS catalog_review_reason VARCHAR(255),
            ADD COLUMN IF NOT EXISTS status_code VARCHAR(5)
        """))

    yield


app = FastAPI(
    title="TruckScope API",
    description="Trucking companies and FMCSA information",
    version="0.4.0",
    lifespan=lifespan,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "service": "TruckScope API",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected",
        }

    except Exception as error:
        raise HTTPException(
            status_code=503,
            detail=f"Database unavailable: {str(error)}",
        )


@app.get("/companies")
def get_companies(
    state: str | None = None,
    search: str | None = None,
    limit: int = Query(default=200, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
):
    conditions = [PUBLIC_COMPANY_FILTER]
    params = {
        "limit": limit,
        "offset": offset,
    }

    if state:
        conditions.append("state = :state")
        params["state"] = state.upper()

    if search and search.strip():
        conditions.append("""
            (
                name ILIKE :search
                OR COALESCE(dba_name, '') ILIKE :search
                OR COALESCE(city, '') ILIKE :search
                OR COALESCE(state, '') ILIKE :search
                OR COALESCE(usdot_number, '') ILIKE :search
            )
        """)
        params["search"] = f"%{search.strip()}%"

    query = f"""
        SELECT
            id,
            name,
            usdot_number,
            dba_name,
            city,
            state,
            truck_count,
            power_units,
            total_drivers,
            authority_status,
            insurance_status,
            fmcsa_entity_status,
            classdef,
            carship,
            data_source,
            fmcsa_imported_at
        FROM companies
        WHERE {" AND ".join(conditions)}
        ORDER BY name, id
        LIMIT :limit OFFSET :offset
    """

    try:
        with engine.connect() as conn:
            result = conn.execute(text(query), params)
            return [dict(row._mapping) for row in result]
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load companies: {str(error)}",
        )


@app.get("/companies/count")
def get_companies_count(
    state: str | None = None,
    search: str | None = None,
):
    conditions = [PUBLIC_COMPANY_FILTER]
    params = {}

    if state:
        conditions.append("state = :state")
        params["state"] = state.upper()

    if search and search.strip():
        conditions.append("""
            (
                name ILIKE :search
                OR COALESCE(dba_name, '') ILIKE :search
                OR COALESCE(city, '') ILIKE :search
                OR COALESCE(state, '') ILIKE :search
                OR COALESCE(usdot_number, '') ILIKE :search
            )
        """)
        params["search"] = f"%{search.strip()}%"

    query = f"""
        SELECT COUNT(*)
        FROM companies
        WHERE {" AND ".join(conditions)}
    """

    try:
        with engine.connect() as conn:
            total = conn.execute(text(query), params).scalar_one()
        return {"total": total}
    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not count companies: {str(error)}",
        )


@app.get("/companies/{company_id}")
def get_company(company_id: int):
    query = f"""
        SELECT *
        FROM companies
        WHERE id = :id
        AND {PUBLIC_COMPANY_FILTER}
    """

    try:
        with engine.connect() as conn:
            result = conn.execute(
                text(query),
                {"id": company_id},
            ).mappings().first()

        if not result:
            raise HTTPException(
                status_code=404,
                detail="Company not found",
            )

        return dict(result)

    except HTTPException:
        raise

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Could not load company: {str(error)}",
        )

from app.news import router as news_router
app.include_router(news_router)

from app.leads import router as leads_router
app.include_router(leads_router)
