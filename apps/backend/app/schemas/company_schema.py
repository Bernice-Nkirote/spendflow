from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


BusinessType = Literal["sole_proprietorship", "partnership", "company"]


class CompanyCreate(BaseModel):
    name: str
    is_active: Optional[bool] = True
    currency: str = "KES"
    business_type: BusinessType = "company"


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    is_active: Optional[bool] = None
    business_type: Optional[BusinessType] = None


class CompanyRead(BaseModel):
    id: UUID
    name: str
    is_active: bool
    currency: str = "KES"
    business_type: BusinessType = "company"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)