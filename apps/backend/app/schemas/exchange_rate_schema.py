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


class ExchangeRateSyncRequest(BaseModel):
    from_currencies: List[str] = Field(default_factory=list, max_length=30)
    effective_date: date | None = None
    overwrite_existing: bool = False

    @field_validator("from_currencies")
    @classmethod
    def normalize_from_currencies(cls, values: List[str]) -> List[str]:
        normalized_values: list[str] = []

        for value in values:
            normalized = value.strip().upper()
            if not normalized:
                continue
            if len(normalized) != 3:
                raise ValueError("Currency codes must be 3-letter ISO codes")
            if normalized not in normalized_values:
                normalized_values.append(normalized)

        return normalized_values


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


class ExchangeRateSyncResponse(BaseModel):
    provider: str
    base_currency: str
    effective_date: date
    created_count: int
    updated_count: int
    skipped_count: int
    failed_count: int
    synced_rates: List[ExchangeRateRead]
    skipped_currencies: List[str]
    failed_currencies: List[str]


class PaginatedExchangeRateResponse(BaseModel):
    rows: List[ExchangeRateRead]
    total_count: int
