from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.schemas.roles_schema import RoleRead

class WorkflowLevelRoleCreate(BaseModel):
    level_id: UUID
    role_id: UUID

class WorkflowLevelRoleUpdate(BaseModel):
    role_id: Optional[UUID]

class WorkflowLevelRoleRead(BaseModel):
    id: UUID
    level_id: UUID
    role_id: UUID
    created_at: datetime
    updated_at: datetime

    role: RoleRead

    model_config=ConfigDict(from_attributes=True)