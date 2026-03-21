from pydantic import BaseModel, ConfigDict
from uuid import UUID
from decimal import Decimal

class PurchaseOrderItemCreate(BaseModel):
    product_name: str
    description: str
    quantity: Decimal
    unit_price: Decimal

class PurchaseOrderItemResponse(BaseModel):
    id: UUID
    product_name:str
    description: str
    quantity: Decimal
    unit_price: Decimal
    total_price: Decimal

    model_config = ConfigDict(from_attributes=True)