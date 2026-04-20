from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class CompanyCreate(BaseModel):
    name: str
    is_active: Optional[bool] = True


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None


class CompanyRead(BaseModel):
    id: UUID
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)