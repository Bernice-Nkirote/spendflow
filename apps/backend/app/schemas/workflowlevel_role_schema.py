from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.schemas.role_schemas import RoleRead


class WorkflowLevelRoleCreate(BaseModel):
    # Workflow level receiving the role assignment
    level_id: UUID

    # Role allowed to approve at this workflow level
    role_id: UUID


class WorkflowLevelRoleUpdate(BaseModel):
    # Optional role update for partial edits
    role_id: Optional[UUID] = None


class WorkflowLevelRoleRead(BaseModel):
    id: UUID
    company_id: UUID
    level_id: UUID
    role_id: UUID
    role_name: Optional[str] = None
    level_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    # Nested role details for easier API consumption
    role: RoleRead

    model_config = ConfigDict(from_attributes=True)