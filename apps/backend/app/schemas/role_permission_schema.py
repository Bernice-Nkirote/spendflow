from uuid import UUID

from pydantic import BaseModel, ConfigDict


class RolePermissionCreate(BaseModel):
    role_id: UUID
    permission_id: UUID


class RolePermissionRead(BaseModel):
    id: UUID
    company_id: UUID
    role_id: UUID
    permission_id: UUID

    model_config = ConfigDict(from_attributes=True)


class RolePermissionDetailRead(BaseModel):
    id: UUID
    role_id: UUID
    role_name: str
    permission_id: UUID
    permission_name: str
    permission_description: str | None = None
    permission_is_active: bool

    model_config = ConfigDict(from_attributes=True)