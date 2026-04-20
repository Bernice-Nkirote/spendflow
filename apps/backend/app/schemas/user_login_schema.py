from uuid import UUID
from pydantic import BaseModel, EmailStr

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    company_id: UUID