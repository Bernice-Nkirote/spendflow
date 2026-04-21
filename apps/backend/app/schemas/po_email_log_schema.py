from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import EmailStatusEnum


class POEmailLogRead(BaseModel):
    id: UUID
    company_id: UUID
    purchase_order_id: UUID
    supplier_id: UUID
    recipient_email: str
    subject: str
    status: EmailStatusEnum
    error_message: Optional[str] = None
    sent_by: Optional[UUID] = None
    sent_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)