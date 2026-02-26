from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

# Base Schema
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    department_id: Optional[UUID] = None

# Input Schema
class UserCreate(UserBase):
    password: str
    role_id: UUID
    company_id: UUID

# Update Schema
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    department_id: Optional[UUID] = None
    role_id: Optional[UUID] = None
    is_active: Optional[bool] = None

# Output Schema
class UserRead(UserBase):
    id: UUID
    company_id: UUID
    role_id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

model_config = {
    "from_attributes": True
}