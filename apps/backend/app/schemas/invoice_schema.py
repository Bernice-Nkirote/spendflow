from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import InvoiceStatusEnum
from app.schemas.invoice_line_item_schema import (
    InvoiceLineItemCreate,
    InvoiceLineItemRead,
)


class InvoiceCreate(BaseModel):
    purchase_order_id: Optional[UUID] = None
    supplier_id: UUID
    invoice_number: str | None = None
    line_items: List[InvoiceLineItemCreate]

    @field_validator("invoice_number")
    @classmethod
    def validate_invoice_number(cls, value: str | None) -> str | None:
        if value is None:
            return value

        value = value.strip()
        if not value:
            raise ValueError("Invoice number cannot be empty")

        return value

    @field_validator("line_items")
    @classmethod
    def validate_line_items(
        cls,
        value: List[InvoiceLineItemCreate],
    ) -> List[InvoiceLineItemCreate]:
        if not value:
            raise ValueError("At least one invoice line item is required")
        return value


class InvoiceUpdate(BaseModel):
    purchase_order_id: Optional[UUID] = None
    supplier_id: Optional[UUID] = None
    invoice_number: Optional[str] = None
    line_items: Optional[List[InvoiceLineItemCreate]] = None

    @field_validator("invoice_number")
    @classmethod
    def validate_invoice_number(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Invoice number cannot be empty")
        return value

    @field_validator("line_items")
    @classmethod
    def validate_line_items(
        cls,
        value: Optional[List[InvoiceLineItemCreate]],
    ) -> Optional[List[InvoiceLineItemCreate]]:
        if value is None:
            return value
        if not value:
            raise ValueError("Line items cannot be empty")
        return value


class InvoiceRead(BaseModel):
    id: UUID
    company_id: UUID
    purchase_order_id: Optional[UUID]
    supplier_id: UUID

    submitted_by_user_id: Optional[UUID]
    submitted_by_supplier_user_id: Optional[UUID]

    invoice_number: str
    total_amount: Decimal

    currency: str

    exchange_rate: Optional[Decimal] = None
    base_currency: Optional[str] = None
    base_amount: Optional[Decimal] = None
    exchange_rate_date: Optional[datetime] = None

    status: InvoiceStatusEnum
    created_at: datetime
    updated_at: datetime

    line_items: List[InvoiceLineItemRead]

    model_config = ConfigDict(from_attributes=True)

class InvoiceDetailRead(InvoiceRead):
    supplier_name: Optional[str] = None
    po_number: Optional[str] = None
    currency: Optional[str] = None
    submitted_by_user_name: Optional[str] = None
    submitted_by_supplier_user_name: Optional[str] = None

class InvoicePaginatedRead(BaseModel):
    rows: list[InvoiceDetailRead]
    total_count: int

    model_config = ConfigDict(from_attributes=True)