from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

from app.models.enums import PaymentMethodEnum, PaymentStatusEnum
from app.schemas.common import AmountType


class PaymentCreate(BaseModel):
    invoice_id: UUID
    amount: AmountType
    payment_method: PaymentMethodEnum
    reference: Optional[str] = None

    @field_validator("reference")
    @classmethod
    def validate_reference(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        value = value.strip()
        if not value:
            return None
        return value


class PaymentUpdate(BaseModel):
    amount: Optional[AmountType] = None
    payment_method: Optional[PaymentMethodEnum] = None
    reference: Optional[str] = None

    @field_validator("reference")
    @classmethod
    def validate_reference(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        value = value.strip()
        if not value:
            return None
        return value


class PaymentRead(BaseModel):
    id: UUID
    company_id: UUID
    invoice_id: UUID
    created_by: Optional[UUID]
    amount: Decimal
    currency: str

    exchange_rate: Optional[Decimal] = None
    base_currency: Optional[str] = None
    base_amount: Optional[Decimal] = None
    exchange_rate_date: Optional[datetime] = None

    payment_method: PaymentMethodEnum
    status: PaymentStatusEnum
    reference: Optional[str]
    paid_at: datetime
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaymentDetailRead(PaymentRead):
    invoice_number: Optional[str] = None
    supplier_name: Optional[str] = None
    created_by_name: Optional[str] = None
    currency: Optional[str] = None