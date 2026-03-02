from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional

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

    model_config=ConfigDict(from_attributes=True)