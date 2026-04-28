from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


class SupplierSpendReportFilter(BaseModel):
    supplier_id: UUID | None = None

    date_from: datetime | None = None
    date_to: datetime | None = None

    min_total_invoice_amount: Decimal | None = Field(default=None, ge=0)
    max_total_invoice_amount: Decimal | None = Field(default=None, ge=0)

    min_total_paid_amount: Decimal | None = Field(default=None, ge=0)
    max_total_paid_amount: Decimal | None = Field(default=None, ge=0)

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

        if (
            self.min_total_invoice_amount is not None
            and self.max_total_invoice_amount is not None
        ):
            if self.min_total_invoice_amount > self.max_total_invoice_amount:
                raise ValueError(
                    "min_total_invoice_amount cannot be greater than max_total_invoice_amount"
                )

        if (
            self.min_total_paid_amount is not None
            and self.max_total_paid_amount is not None
        ):
            if self.min_total_paid_amount > self.max_total_paid_amount:
                raise ValueError(
                    "min_total_paid_amount cannot be greater than max_total_paid_amount"
                )

        return self


class SupplierSpendReportRow(BaseModel):
    supplier_id: UUID
    supplier_name: str
    total_invoice_amount: Decimal
    total_paid_amount: Decimal
    outstanding_amount: Decimal
    invoice_count: int
    payment_count: int


class SupplierSpendReportResponse(BaseModel):
    rows: list[SupplierSpendReportRow]
    total_count: int