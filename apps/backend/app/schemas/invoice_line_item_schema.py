from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class InvoiceLineItemCreate(BaseModel):
    purchase_order_item_id: UUID
    description: str
    invoiced_quantity: Decimal
    unit_price: Decimal

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Description is required")
        return value

    @field_validator("invoiced_quantity", "unit_price")
    @classmethod
    def validate_positive_amounts(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("Must be greater than 0")
        return value


class InvoiceLineItemUpdate(BaseModel):
    description: Optional[str] = None
    invoiced_quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Description cannot be empty")
        return value

    @field_validator("invoiced_quantity", "unit_price")
    @classmethod
    def validate_positive_amounts(
        cls,
        value: Optional[Decimal],
    ) -> Optional[Decimal]:
        if value is None:
            return value
        if value <= 0:
            raise ValueError("Must be greater than 0")
        return value


class InvoiceLineItemRead(BaseModel):
    id: UUID
    company_id: UUID
    invoice_id: UUID
    purchase_order_item_id: UUID
    description: str
    invoiced_quantity: Decimal
    unit_price: Decimal
    total_price: Decimal
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)