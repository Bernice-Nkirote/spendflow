from pydantic import BaseModel, field_validator


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
    token_type: str = "bearer"