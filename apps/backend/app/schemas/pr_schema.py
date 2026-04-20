from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PRStatusEnum
from app.schemas.pr_item_schema import (
    PurchaseRequisitionItemCreate,
    PurchaseRequisitionItemRead,
)


class PurchaseRequisitionCreate(BaseModel):
    title: str
    description: Optional[str] = None
    currency: Optional[str] = "KES"
    department_id: Optional[UUID] = None
    items: list[PurchaseRequisitionItemCreate]


class PurchaseRequisitionUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    currency: Optional[str] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class PurchaseRequisitionRead(BaseModel):
    id: UUID
    company_id: UUID
    pr_number: str
    department_id: Optional[UUID] = None
    requested_by: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    total_amount: Decimal = Field(..., max_digits=14, decimal_places=2)
    currency: str
    status: PRStatusEnum
    is_active: bool
    items: list[PurchaseRequisitionItemRead]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: lambda v: format(v, ".2f")},
    )