from pydantic import BaseModel

class SupplierLogin(BaseModel):
    email: str
    password: str