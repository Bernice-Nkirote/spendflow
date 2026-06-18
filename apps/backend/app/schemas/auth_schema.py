from uuid import UUID
from pydantic import BaseModel


class AuthMeResponse(BaseModel):
    id: UUID
    name: str
    email: str
    company_id: UUID
    role_id: UUID | None = None
    role_name: str | None = None
    company_name: str | None = None
    business_type: str | None = None
    is_company_owner: bool = False
    permissions: list[str] = []

class TokenRefreshRequest(BaseModel):
    refresh_token: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
