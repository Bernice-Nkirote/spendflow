from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class SupplierCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    is_active: Optional[bool] = None


class SupplierRead(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    contact_person: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedSupplierResponse(BaseModel):
    rows: list[SupplierRead]
    total_count: int


class SupplierSummaryRead(BaseModel):
    supplier_id: UUID
    supplies: list[str]
    location: Optional[str] = None
    recent_supplied_items: list[str]


# SUPPLIER IMPORT 
class SupplierImportError(BaseModel):
    row: int
    message: str


class SupplierImportResult(BaseModel):
    created_count: int
    failed_count: int
    errors: list[SupplierImportError]
    created_suppliers: list[SupplierRead]
