from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional

# Base schema for shared fields
class CompanyBase(BaseModel):
    name: str
    is_active: Optional[bool] = True

# Schema for creating a company (request body)
class CompanyCreate(CompanyBase):
    pass

# Schema for updating a company
class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None

# Schema for responses
class CompanyResponse(CompanyBase):
    id: UUID  # UUID generated automatically by the database

    # This tells Pydantic v2 to read attributes from ORM objects
    model_config = ConfigDict(from_attributes=True)