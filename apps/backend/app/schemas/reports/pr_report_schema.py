from datetime import datetime
from decimal import Decimal
from uuid import UUID

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
    department_id: UUID | None = None
    department_name: str | None = None
    requested_by: UUID | None = None
    total_amount: Decimal
    currency: str
    status: str
    item_count: int
    created_at: datetime


class PRReportResponse(BaseModel):
    rows: list[PRReportRow]
    total_count: int