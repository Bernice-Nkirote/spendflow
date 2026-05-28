from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import POStatusEnum
from app.schemas.po_items_schema import (
    PurchaseOrderItemCreate,
    PurchaseOrderItemRead,
)


class PurchaseOrderCreate(BaseModel):
    supplier_id: UUID
    department_id: Optional[UUID] = None
    currency: str = "KES"
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate] = Field(default_factory=list)


class PurchaseOrderUpdate(BaseModel):
    supplier_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    currency: Optional[str] = None
    notes: Optional[str] = None
    items: Optional[List[PurchaseOrderItemCreate]] = None


class PurchaseOrderRead(BaseModel):
    id: UUID
    company_id: UUID
    po_number: str
    created_by: UUID
    submitted_by: Optional[UUID] = None
    issued_by: Optional[UUID] = None
    purchase_requisition_id: Optional[UUID] = None
    supplier_id: UUID
    department_id: Optional[UUID] = None
    status: POStatusEnum
    total_amount: Decimal
    currency: str

    exchange_rate: Optional[Decimal] = None
    base_currency: Optional[str] = None
    base_amount: Optional[Decimal] = None
    exchange_rate_date: Optional[datetime] = None

    notes: Optional[str] = None
    submitted_at: Optional[datetime] = None
    issued_at: Optional[datetime] = None

    signed_pdf_file_path: Optional[str] = None
    signed_pdf_original_filename: Optional[str] = None
    signed_pdf_uploaded_by: Optional[UUID] = None
    signed_pdf_uploaded_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime
    items: List[PurchaseOrderItemRead]

    model_config = ConfigDict(from_attributes=True)

class PurchaseOrderDetailRead(PurchaseOrderRead):
    supplier_name: Optional[str] = None
    supplier_email: Optional[str] = None
    department_name: Optional[str] = None
    created_by_name: Optional[str] = None
    submitted_by_name: Optional[str] = None
    issued_by_name: Optional[str] = None
    signed_pdf_uploaded_by_name: Optional[str] = None
    pr_number: Optional[str] = None

class PurchaseOrderPaginatedRead(BaseModel):
    rows: list[PurchaseOrderDetailRead]
    total_count: int

    model_config = ConfigDict(from_attributes=True)