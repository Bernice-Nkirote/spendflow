from pydantic import BaseModel, EmailStr

class UserLogin(BaseModel):
    company_name: str
    email: EmailStr
    password: str
    
    