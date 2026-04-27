from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


class CompanySignupRequest(BaseModel):
    company_name: str
    admin_name: str
    admin_email: EmailStr
    password: str
    phone_number: Optional[str] = None


class SignupCompanyRead(BaseModel):
    id: UUID
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SignupAdminUserRead(BaseModel):
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


class SignupSeededRoleRead(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SignupSeededDepartmentRead(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CompanySignupResponse(BaseModel):
    company: SignupCompanyRead
    admin_user: SignupAdminUserRead
    seeded_roles: list[SignupSeededRoleRead]
    seeded_departments: list[SignupSeededDepartmentRead]