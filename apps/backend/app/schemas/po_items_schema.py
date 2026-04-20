from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class PurchaseOrderItemCreate(BaseModel):
    item_name: str
    description: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal


class PurchaseOrderItemUpdate(BaseModel):
    item_name: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None


class PurchaseOrderItemRead(BaseModel):
    id: UUID
    company_id: UUID
    purchase_order_id: UUID
    item_name: str
    description: Optional[str] = None
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)