from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from pydantic import field_validator

   # This part needs review 

# INVOICES
class InvoiceCreate(BaseModel):
    invoice_number: str
    purchase_order_id: UUID
    supplier_id: Optional[UUID] = None #Only needed if company creates invoice
    line_items: List[InvoiceLineItemCreate]

class InvoiceRead(InvoiceCreate):
    id: UUID
    purchase_order_id: UUID
    company_id: UUID
    supplier_id: UUID

    submitted_by_user_id: Optional[UUID]
    submitted_by_supplier_id: Optional[UUID]

    invoice_number: str
    total_amount: Decimal
    status: str

    created_at: datetime
    updated_at: datetime

    line_items: List[InvoiceLineItemRead]

# Invoice Line Item
class InvoiceLineItemCreate(BaseModel):
    purchase_order_item_id: UUID
    description: str
    invoiced_quantity: Decimal
    unit_price: Decimal

    @field_validator("invoiced_quantity", "unit_price")
    def must_be_positive(cls, v):
        if v <= 0:
            raise ValueError("Must be greater than 0")
        return v

class InvoiceLineItemRead(BaseModel):
    id: UUID
    purchase_order_item_id: UUID
    description: str
    invoiced_quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

    model_config = ConfigDict(from_attributes=True)
