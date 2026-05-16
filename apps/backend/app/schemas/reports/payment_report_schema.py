from datetime import datetime
from decimal import Decimal
from uuid import UUID

from app.models.enums import PaymentStatusEnum

from pydantic import BaseModel, Field, model_validator


class PaymentReportFilter(BaseModel):
    status: PaymentStatusEnum | None = None
    payment_method: str | None = None
    invoice_id: UUID | None = None
    supplier_id: UUID | None = None

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


class PaymentReportRow(BaseModel):
    payment_id: UUID
    payment_reference: str | None = None

    invoice_id: UUID
    invoice_number: str

    supplier_id: UUID 
    supplier_name: str | None = None

    amount: Decimal
    currency: str | None = None

    exchange_rate: Decimal | None = None
    base_currency: str | None = None
    base_amount: Decimal | None = None
    exchange_rate_date: datetime | None = None

    payment_method: str | None = None
    status: str

    created_by_id: UUID | None = None
    created_by_name: str | None = None

    created_at: datetime
    paid_at: datetime | None = None


class PaymentReportResponse(BaseModel):
    rows: list[PaymentReportRow]
    total_count: int