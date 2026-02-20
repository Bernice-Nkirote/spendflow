from pydantic import BaseModel, UUID4, Field, ConfigDict
from typing import List, Optional
from decimal import Decimal
from datetime import datetime

class PRItemCreate(BaseModel):
    description: str
    quantity: Decimal = Field(..., max_digits=10, decimal_places=2)
    unit_price: Decimal = Field(..., max_digits=14, decimal_places=2)

class PRItemRead(PRItemCreate):
    id: UUID4
    description: str
    quantity:Decimal
    unit_price: Decimal
    line_total: Decimal = Field(..., max_digits=14, decimal_places=2)
    created_at: datetime
    updated_at:datetime
    
    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={Decimal: lambda v: format(v, ".2f")}
    )
   

class PurchaseRequisitionCreate(BaseModel):
    title: str
    description: Optional[str]
    currency: Optional[str] = "KES"
    department_id: Optional[UUID4]
    items: List[PRItemCreate]

class PurchaseRequisitionRead(BaseModel):
    id: UUID4
    company_id:UUID4
    department_id: Optional[UUID4]
    requested_by: Optional[UUID4]
    title: str
    description: Optional[str]
    total_amount: Decimal
    currency: str
    status: str
    items: List[PRItemRead]
    is_active: bool
    created_at: datetime
    updated_at:datetime

model_config = ConfigDict(
    from_attributes=True,
    json_encoders={Decimal: lambda v: format(v, ".2f")}
)
    