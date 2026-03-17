from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class DepartmentBase(BaseModel):
    name: str 
    is_active:bool = True

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None

class DepartmentRead(DepartmentBase):
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: datetime

     # This tells Pydantic v2 to read attributes from ORM objects
    model_config = ConfigDict(from_attributes=True)