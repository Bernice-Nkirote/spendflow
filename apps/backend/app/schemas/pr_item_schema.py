from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class PurchaseRequisitionItemCreate(BaseModel):
    item_name: str
    description: str
    quantity: Decimal = Field(..., max_digits=10, decimal_places=2)
    unit_price: Optional[Decimal] = Field(
        default=None,
        max_digits=14,
        decimal_places=2,
    )


class PurchaseRequisitionItemUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[Decimal] = Field(
        default=None,
        max_digits=10,
        decimal_places=2,
    )
    unit_price: Optional[Decimal] = Field(
        default=None,
        max_digits=14,
        decimal_places=2,
    )


class PurchaseRequisitionItemRead(BaseModel):
    id: UUID
    company_id: UUID
    requisition_id: UUID
    item_name: str
    description: str
    quantity: Decimal = Field(..., max_digits=10, decimal_places=2)
    unit_price: Optional[Decimal] = Field(
        default=None,
        max_digits=14,
        decimal_places=2,
    )
    line_total: Optional[Decimal] = Field(
        default=None,
        max_digits=14,
        decimal_places=2,
    )
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: lambda v: format(v, ".2f")},
    )