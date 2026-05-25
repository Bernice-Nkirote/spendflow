from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class GlobalSearchItem(BaseModel):
    entity_type: str
    entity_id: UUID
    title: str
    subtitle: Optional[str] = None
    reference: Optional[str] = None
    status: Optional[str] = None
    route: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class GlobalSearchResponse(BaseModel):
    purchase_requisitions: list[GlobalSearchItem]
    purchase_orders: list[GlobalSearchItem]
    invoices: list[GlobalSearchItem]
    payments: list[GlobalSearchItem]
    suppliers: list[GlobalSearchItem]
    users: list[GlobalSearchItem]