from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator
from app.models.enums import POStatusEnum


class POReportFilter(BaseModel):
    status: POStatusEnum | None = None
    supplier_id: UUID | None = None
    department_id: UUID | None = None
    purchase_requisition_id: UUID | None = None

    date_from: datetime | None = None
    date_to: datetime | None = None

    min_amount: Decimal | None = Field(default=None, ge=0)
    max_amount: Decimal | None = Field(default=None, ge=0)

    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=100, ge=1, le=500)

    model_config = {
        "extra": "forbid",
    }

    @model_validator(mode="after")
    def validate_filter_ranges(self):
        if self.date_from and self.date_to:
            if self.date_from > self.date_to:
                raise ValueError("date_from cannot be later than date_to")

        if self.min_amount is not None and self.max_amount is not None:
            if self.min_amount > self.max_amount:
                raise ValueError("min_amount cannot be greater than max_amount")

        return self

class POReportRow(BaseModel):
    po_id: UUID
    po_number: str

    supplier_id: UUID | None = None
    supplier_name: str | None = None

    department_id: UUID | None = None
    department_name: str | None = None

    purchase_requisition_id: UUID | None = None
    pr_number: str | None = None

    created_by_name: str | None = None
    submitted_by_name: str | None = None
    issued_by_name: str | None = None

    item_id: UUID
    item_name: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal
    base_line_total: Decimal | None = None

    po_total_amount: Decimal
    currency: str

    exchange_rate: Decimal | None = None
    base_currency: str | None = None
    base_amount: Decimal | None = None
    exchange_rate_date: datetime | None = None

    status: POStatusEnum

    created_at: datetime
    submitted_at: datetime | None = None
    issued_at: datetime | None = None

class POReportResponse(BaseModel):
    rows: list[POReportRow]
    total_count: int
