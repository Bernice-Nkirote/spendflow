from pydantic import BaseModel, field_validator
from uuid import UUID

class SupplierLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not value:
            raise ValueError("Email is required")
        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Password is required")
        return value


class SupplierLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class SupplierTokenRefreshRequest(BaseModel):
    refresh_token: str

class SupplierForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        value = value.strip().lower()
        if not value:
            raise ValueError("Email is required")
        return value


class SupplierResetPasswordRequest(BaseModel):
    token: str
    password: str

    @field_validator("token")
    @classmethod
    def validate_token(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Reset token is required")
        return value

    @field_validator("password")
    @classmethod
    def validate_reset_password(cls, value: str) -> str:
        value = value.strip()
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters long")
        return value
    
class SupplierMeResponse(BaseModel):
    id: UUID
    supplier_id: UUID
    email: str
    is_active: bool
    has_completed_onboarding: bool
    supplier_name: str | None = None