from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class RoleBase(BaseModel):
    name: str
    description: Optional[str]

#  Input Schema
class RoleCreate(RoleBase):
    company_id: UUID

#  Update role
class RoleUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    is_active: Optional[bool]

# Output 
class RoleRead(RoleBase):
    id: UUID
    company_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

model_config = {
    "from_attributes":True
}