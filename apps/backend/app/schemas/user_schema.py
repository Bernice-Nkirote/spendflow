from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone_number: Optional[str] = None
    department_id: Optional[UUID] = None
    role_id: UUID
   

class UserLogin(BaseModel):
    company_name: str
    email: EmailStr
    password: str

class UserPasswordSetup(BaseModel):
    token: str
    password: str

class ForgotPasswordRequest(BaseModel):
    company_name: str
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
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
    department_name: Optional[str] = None

    role_id: UUID
    role_name: Optional[str] = None

    name: str
    email: EmailStr
    phone_number: Optional[str] = None

    is_active: bool
    is_company_owner: bool
    has_completed_onboarding: bool
    onboarded_at: Optional[datetime] = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedUserResponse(BaseModel):
    rows: List[UserRead]
    total_count: int