from pydantic import BaseModel, ConfigDict, Field


class CompanyCreate(BaseModel):
    name: str
    usdot_number: str
    city: str
    state: str
    truck_count: int = Field(ge=5)
    authority_status: str
    insurance_status: str


class CompanyResponse(CompanyCreate):
    id: int
    model_config = ConfigDict(from_attributes=True)
