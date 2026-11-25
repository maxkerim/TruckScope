import argparse
import sys
from pathlib import Path

import requests
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.database import engine


API_URL = "https://data.transportation.gov/resource/az4n-8mr2.json"

PAGE_SIZE = 5000

EXCLUDED_KEYWORDS = [
    "TOWING",
    "WRECKER",
    "TOW TRUCK",
    "ROADSIDE ASSISTANCE",
    "TRUCK LEASING",
    "LEASING",
    "RENTAL",
    "WASTE MANAGEMENT",
    "WASTE SERVICES",
    "GARBAGE",
    "TRASH",
    "CONSTRUCTION",
    "CONTRACTOR",
    "CONCRETE",
    "CRANE",
    "ASPHALT",
    "INFRASTRUCTURE",
    "APPLIANCE INSTALLATION",
    "APPLIANCE INSTALLERS",
]

REVIEW_KEYWORDS = [
    "RETAIL",
    "WHOLESALE",
    "DISTRIBUTION",
    "SUPERMARKET",
    "GROCERY",
    "MARKET",
    "STORE",
    "SHOP",
    "FOODS",
    "FOOD SERVICE",
    "RECYCLING",
    "FARM",
    "FARMS",
    "WAREHOUSE",
    "SUPPLY",
    "IRRIGATION",
    "BODY COMPANY",
]

APPROVED_KEYWORDS = [
    "TRUCKING",
    "TRUCK",
    "TRANSPORT",
    "TRANSPORTATION",
    "FREIGHT",
    "CARRIER",
    "CARRIERS",
    "LOGISTICS",
    "HAULING",
    "CARTAGE",
    "DRAYAGE",
    "INTERMODAL",
    "MOTOR FREIGHT",
    "TRANSFER",
    "TRANSIT",
    "MOVING",
    "EXPRESS",
    "DELIVERY",
    "COURIER",
]


def classify_company(name):
    name = (name or "").upper()

    if any(word in name for word in EXCLUDED_KEYWORDS):
        return "EXCLUDED", "Excluded business category"

    if any(word in name for word in REVIEW_KEYWORDS):
        return "NEEDS_REVIEW", "Ambiguous business category"

    if any(word in name for word in APPROVED_KEYWORDS):
        return "APPROVED", "Transport-related company name"

    return "NEEDS_REVIEW", "No clear transport business keyword"


def to_int(value):
    try:
        if value is None or value == "":
            return None
        return int(float(value))
    except (ValueError, TypeError):
        return None


def prepare_database():
    statements = [
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS catalog_status VARCHAR(30)
        DEFAULT 'needs_review'
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS catalog_review_reason VARCHAR(255)
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS status_code VARCHAR(5)
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS dba_name VARCHAR(255)
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS power_units INTEGER
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS total_drivers INTEGER
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS classdef TEXT
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS carship TEXT
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS fmcsa_entity_status VARCHAR(30)
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS data_source VARCHAR(30)
        """,
        """
        ALTER TABLE companies
        ADD COLUMN IF NOT EXISTS fmcsa_imported_at TIMESTAMP
        """,
    ]

    with engine.begin() as connection:
        for statement in statements:
            connection.execute(text(statement))


def fetch_companies(session, offset, limit):
    params = {
        "$select": (
            "dot_number,legal_name,phy_city,phy_state,phy_country,"
            "truck_units,power_units,total_drivers,status_code,"
            "classdef,carship"
        ),
        "$where": (
            "status_code = 'A' "
            "AND truck_units::number BETWEEN 6 AND 1900 "
            "AND power_units::number BETWEEN 6 AND 1900 "
            "AND total_drivers::number >= 6 "
            "AND phy_country = 'US' "
            "AND classdef LIKE '%AUTHORIZED FOR HIRE%' "
            "AND carship LIKE '%C%'"
        ),
        "$order": "dot_number ASC",
        "$limit": str(limit),
        "$offset": str(offset),
    }

    response = session.get(API_URL, params=params, timeout=90)
    response.raise_for_status()

    data = response.json()

    if not isinstance(data, list):
        raise RuntimeError("FMCSA API returned unexpected data")

    return data


def save_companies(records):
    sql = text(
        """
        INSERT INTO companies (
            name,
            usdot_number,
            city,
            state,
            truck_count,
            dba_name,
            power_units,
            total_drivers,
            authority_status,
            insurance_status,
            fmcsa_entity_status,
            status_code,
            classdef,
            carship,
            data_source,
            fmcsa_imported_at,
            catalog_status,
            catalog_review_reason
        )
        VALUES (
            :name,
            :usdot_number,
            :city,
            :state,
            :truck_count,
            :dba_name,
            :power_units,
            :total_drivers,
            NULL,
            NULL,
            :fmcsa_entity_status,
            :status_code,
            :classdef,
            :carship,
            'FMCSA',
            NOW(),
            :catalog_status,
            :catalog_review_reason
        )
        ON CONFLICT (usdot_number)
        DO UPDATE SET
            name = EXCLUDED.name,
            city = EXCLUDED.city,
            state = EXCLUDED.state,
            truck_count = EXCLUDED.truck_count,
            dba_name = EXCLUDED.dba_name,
            power_units = EXCLUDED.power_units,
            total_drivers = EXCLUDED.total_drivers,
            fmcsa_entity_status = EXCLUDED.fmcsa_entity_status,
            status_code = EXCLUDED.status_code,
            classdef = EXCLUDED.classdef,
            carship = EXCLUDED.carship,
            data_source = 'FMCSA',
            fmcsa_imported_at = NOW(),
            catalog_status = EXCLUDED.catalog_status,
            catalog_review_reason = EXCLUDED.catalog_review_reason
        """
    )

    with engine.begin() as connection:
        for company in records:
            connection.execute(sql, company)


def normalize_record(record):
    name = (record.get("legal_name") or "").strip()
    dot_number = record.get("dot_number")

    truck_units = to_int(record.get("truck_units"))
    power_units = to_int(record.get("power_units"))
    total_drivers = to_int(record.get("total_drivers"))

    if not name or not dot_number:
        return None

    if (
        truck_units is None
        or power_units is None
        or total_drivers is None
    ):
        return None

    status, reason = classify_company(name)

    return {
        "name": name,
        "usdot_number": str(dot_number),
        "city": record.get("phy_city"),
        "state": record.get("phy_state"),
        "truck_count": truck_units,
        "dba_name": None,
        "power_units": power_units,
        "total_drivers": total_drivers,
        "fmcsa_entity_status": record.get("status_code"),
        "status_code": record.get("status_code"),
        "classdef": record.get("classdef"),
        "carship": record.get("carship"),
        "catalog_status": status.lower(),
        "catalog_review_reason": reason,
    }


def main():
    parser = argparse.ArgumentParser(
        description="Import eligible FMCSA trucking companies"
    )

    parser.add_argument(
        "--limit",
        type=int,
        default=100,
        help="Maximum number of records to process",
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all matching FMCSA records",
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview results without saving to PostgreSQL",
    )

    args = parser.parse_args()

    if args.limit < 1:
        parser.error("--limit must be greater than zero")

    print()
    print("TRUCKSCOPE FMCSA IMPORTER")
    print("=" * 60)
    print("Truck units: 6-1,900")
    print("Power units: 6-1,900")
    print("Drivers: 6+")
    print("Status: Active")
    print(f"Dry run: {args.dry_run}")
    print("=" * 60)

    if not args.dry_run:
        prepare_database()

    session = requests.Session()
    session.headers.update(
        {"User-Agent": "TruckScope FMCSA Importer"}
    )

    processed = 0
    approved = 0
    review = 0
    excluded = 0
    invalid = 0

    approved_samples = []
    review_samples = []
    excluded_samples = []

    records_to_save = []

    offset = 0
    target = None if args.all else args.limit

    try:
        while target is None or processed < target:
            remaining = (
                PAGE_SIZE
                if target is None
                else min(PAGE_SIZE, target - processed)
            )

            records = fetch_companies(
                session,
                offset,
                remaining,
            )

            if not records:
                break

            for record in records:
                processed += 1

                company = normalize_record(record)

                if company is None:
                    invalid += 1
                    continue

                status = company["catalog_status"].upper()
                name = company["name"]
                trucks = company["truck_count"]

                if status == "APPROVED":
                    approved += 1
                    if len(approved_samples) < 15:
                        approved_samples.append((trucks, name))
                    records_to_save.append(company)

                elif status == "NEEDS_REVIEW":
                    review += 1
                    if len(review_samples) < 15:
                        review_samples.append((trucks, name))
                    records_to_save.append(company)

                else:
                    excluded += 1
                    if len(excluded_samples) < 15:
                        excluded_samples.append((trucks, name))

            print(
                f"Processed: {processed} | "
                f"Approved: {approved} | "
                f"Review: {review} | "
                f"Excluded: {excluded}"
            )

            offset += len(records)

            if len(records) < remaining:
                break

    except requests.RequestException as error:
        print(f"\nFMCSA API ERROR: {error}")
        return

    if not args.dry_run and records_to_save:
        save_companies(records_to_save)

    print()
    print("FINAL RESULTS")
    print("=" * 60)
    print(f"Processed: {processed}")
    print(f"Approved: {approved}")
    print(f"Needs review: {review}")
    print(f"Excluded: {excluded}")
    print(f"Invalid: {invalid}")

    print()
    print("APPROVED COMPANIES")
    print("=" * 60)

    for trucks, name in approved_samples:
        print(f"APPROVED     | {trucks:5} trucks | {name}")

    print()
    print("COMPANIES NEEDING REVIEW")
    print("=" * 60)

    for trucks, name in review_samples:
        print(f"NEEDS_REVIEW | {trucks:5} trucks | {name}")

    print()
    print("EXCLUDED COMPANIES")
    print("=" * 60)

    for trucks, name in excluded_samples:
        print(f"EXCLUDED     | {trucks:5} trucks | {name}")

    if args.dry_run:
        print()
        print("DRY RUN: Nothing was saved to PostgreSQL.")
    else:
        print()
        print(f"Saved {len(records_to_save)} companies to PostgreSQL.")


if __name__ == "__main__":
    main()
