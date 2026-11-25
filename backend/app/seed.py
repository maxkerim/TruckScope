from sqlalchemy import select
from .database import Base, engine, SessionLocal
from .models import Company

Base.metadata.create_all(bind=engine)

demo_company = {
    "name": "TruckScope Demo Transport",
    "usdot_number": "1234567",
    "city": "Dallas",
    "state": "TX",
    "truck_count": 48,
    "authority_status": "Active",
    "insurance_status": "Active"
}

with SessionLocal() as db:
    existing = db.scalar(
        select(Company).where(
            Company.usdot_number == demo_company["usdot_number"]
        )
    )

    if not existing:
        db.add(Company(**demo_company))
        db.commit()
        print("Demo company added")
    else:
        print("Company already exists")
