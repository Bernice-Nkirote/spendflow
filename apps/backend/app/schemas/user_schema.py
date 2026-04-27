from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    department_id: Optional[UUID] = None
    role_id: UUID
    password: str


class UserLogin(BaseModel):
    company_name: str
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    department_id: Optional[UUID] = None
    role_id: Optional[UUID] = None
    is_active: Optional[bool] = None


class UserRead(BaseModel):
    id: UUID
    company_id: UUID
    department_id: Optional[UUID] = None
    role_id: UUID
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)