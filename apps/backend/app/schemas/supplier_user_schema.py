from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class SupplierUserCreate(BaseModel):
    supplier_id: UUID
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not value:
            raise ValueError("Email is required")
        return value


class SupplierUserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        value = value.strip().lower()
        if not value:
            raise ValueError("Email cannot be empty")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value

        value = value.strip()

        if not value:
            raise ValueError("Password cannot be empty")

        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes")

        return value


class SupplierSetPassword(BaseModel):
    token: str
    password: str

    @field_validator("token")
    @classmethod
    def validate_token(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Setup token is required")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Password is required")

        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")

        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password cannot be longer than 72 bytes")

        return value


class SupplierUserRead(BaseModel):
    id: UUID
    supplier_id: UUID
    email: str
    is_active: bool
    has_completed_onboarding: bool
    setup_link: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)