# PAYMENT
from pydantic import BaseModel, ConfigDict, Field
from typing import Annotated
from uuid import UUID
from decimal import Decimal
from datetime import datetime

from app.models.enums import PaymentStatusEnum, PaymentMethodEnum
from app.schemas.common import AmountType

class PaymentCreate(BaseModel):
    invoice_id: UUID
    amount: AmountType    
    payment_method: PaymentMethodEnum
    reference:str | None=None

class PaymentResponse(BaseModel):
    id: UUID
    invoice_id: UUID
    amount: Decimal
    payment_method: PaymentMethodEnum
    status: PaymentStatusEnum
    reference: str | None
    paid_at: datetime

    model_config = ConfigDict(from_attributes=True)