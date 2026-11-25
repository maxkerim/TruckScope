from sqlalchemy import String, Integer
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    usdot_number: Mapped[str] = mapped_column(String(20), unique=True, index=True)
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(2))
    truck_count: Mapped[int] = mapped_column(Integer, default=0)
    authority_status: Mapped[str] = mapped_column(String(50))
    insurance_status: Mapped[str] = mapped_column(String(50))
