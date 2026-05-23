from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ExchangeRateCreate(BaseModel):
    from_currency: str
    to_currency: str
    rate: Decimal = Field(..., gt=0)
    source: Optional[str] = "MANUAL"
    effective_date: date

    @field_validator("from_currency", "to_currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        value = value.strip().upper()

        if len(value) != 3:
            raise ValueError("Currency code must be a 3-letter ISO code")

        return value

    @field_validator("source")
    @classmethod
    def normalize_source(cls, value: Optional[str]) -> str:
        if value is None:
            return "MANUAL"

        value = value.strip().upper()
        return value or "MANUAL"


class ExchangeRateUpdate(BaseModel):
    rate: Optional[Decimal] = Field(default=None, gt=0)
    source: Optional[str] = None
    effective_date: Optional[date] = None

    @field_validator("source")
    @classmethod
    def normalize_source(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        value = value.strip().upper()
        return value or "MANUAL"


class ExchangeRateRead(BaseModel):
    id: UUID
    company_id: UUID
    from_currency: str
    to_currency: str
    rate: Decimal
    source: str
    effective_date: date
    created_by: Optional[UUID] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedExchangeRateResponse(BaseModel):
    rows: List[ExchangeRateRead]
    total_count: int