from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, model_validator, ConfigDict


class SupplierLeadTimeReportFilter(BaseModel):
    supplier_id: UUID | None = None

    date_from: datetime | None = None
    date_to: datetime | None = None

    min_lead_time_days: float | None = Field(default=None, ge=0)
    max_lead_time_days: float | None = Field(default=None, ge=0)

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
            self.min_lead_time_days is not None
            and self.max_lead_time_days is not None
        ):
            if self.min_lead_time_days > self.max_lead_time_days:
                raise ValueError(
                    "min_lead_time_days cannot be greater than max_lead_time_days"
                )

        return self


class SupplierLeadTimeReportRow(BaseModel):
    po_id: UUID
    po_number: str
    supplier_id: UUID
    supplier_name: str
    invoice_id: UUID | None = None
    invoice_number: str | None = None
    issued_at: datetime | None = None
    invoice_created_at: datetime | None = None
    lead_time_days: float | None = None


class SupplierLeadTimeReportResponse(BaseModel):
    rows: list[SupplierLeadTimeReportRow]
    total_count: int

class SupplierLeadTimeDetailResponse(BaseModel):
    po_id: UUID
    po_number: str

    supplier_id: UUID
    supplier_name: str

    invoice_id: UUID | None = None
    invoice_number: str | None = None

    issued_at: datetime | None = None
    invoice_created_at: datetime | None = None
    lead_time_days: float | None = None

    po_status: str
    invoice_status: str | None = None

    model_config = ConfigDict(from_attributes=True)