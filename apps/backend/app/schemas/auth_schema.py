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