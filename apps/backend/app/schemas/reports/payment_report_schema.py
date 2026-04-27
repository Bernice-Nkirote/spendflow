from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class PaymentReportFilter(BaseModel):
    status: str | None = None
    payment_method: str | None = None
    invoice_id: UUID | None = None
    supplier_id: UUID | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    min_amount: Decimal | None = None
    max_amount: Decimal | None = None
    skip: int = 0
    limit: int = 100


class PaymentReportRow(BaseModel):
    payment_id: UUID
    invoice_id: UUID
    invoice_number: str | None = None
    supplier_id: UUID | None = None
    supplier_name: str | None = None
    amount: Decimal
    status: str
    payment_method: str | None = None
    reference: str | None = None
    created_by: UUID | None = None
    created_at: datetime
    paid_at: datetime | None = None


class PaymentReportResponse(BaseModel):
    rows: list[PaymentReportRow]
    total_count: int