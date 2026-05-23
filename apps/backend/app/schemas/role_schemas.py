from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    is_active: bool = True


class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class RoleRead(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    description: Optional[str] = None
    is_active: bool
    is_system_role: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class PaginatedRoleResponse(BaseModel):
    rows: List[RoleRead]
    total_count: int