from pydantic import BaseModel, ConfigDict
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import List, Optional
from app.schemas.po_items_schema import PurchaseOrderItemCreate, PurchaseOrderItemResponse


class PurchaseOrderCreate(BaseModel):
    supplier_id: UUID
    currency: str = "KES"
    notes: Optional[str] = None
    items: List[PurchaseOrderItemCreate]

class PurchaseOrderResponse(BaseModel):
    id: UUID
    po_number: str
    supplier_id: UUID
    status: str
    total_amount: Decimal
    currency: str
    created_at: datetime

    items: List[PurchaseOrderItemResponse]

    model_config = ConfigDict(from_attributes=True)



