from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class DepartmentCreate(BaseModel):
    name: str
    is_active: bool = True


class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class DepartmentRead(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)