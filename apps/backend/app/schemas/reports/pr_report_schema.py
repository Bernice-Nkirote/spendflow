from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from app.models.enums import PRStatusEnum

from pydantic import BaseModel, Field, model_validator


class PRReportFilter(BaseModel):
    status: str | None = None
    department_id: UUID | None = None
    requested_by: UUID | None = None

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


class PRReportRow(BaseModel):
    pr_id: UUID
    pr_number: str
    title: str

    department_id: Optional[UUID] = None
    department_name: Optional[str] = None

    requested_by_id: Optional[UUID] = None
    requested_by_name: Optional[str] = None

    item_id: UUID
    item_name: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal

    pr_total_amount: Decimal = Field(..., max_digits=14, decimal_places=2)
    currency: str

    exchange_rate: Decimal | None = None
    base_currency: str | None = None
    base_amount: Decimal | None = None
    exchange_rate_date: datetime | None = None

    status: PRStatusEnum
    created_at: datetime


class PRReportResponse(BaseModel):
    rows: list[PRReportRow]
    total_count: int