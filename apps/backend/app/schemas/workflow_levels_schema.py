from pydantic import BaseModel,ConfigDict,Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from workflowlevel_role_schema import WorkflowLevelRoleRead

class WorkflowLevelBase(BaseModel):
    level_order: int
    min_amount: Optional[float]
    max_amount: Optional[float]
    department_id: UUID
    condition_expression: Optional[dict]

class WorkflowLevelCreate(WorkflowLevelBase):
    workflow_id: UUID

class WorkflowLevelUpdate(BaseModel):
    level_order: Optional[int]
    min_amount: Optional[float]
    max_amount: Optional[float]
    department_id: Optional[UUID]
    condition_expression: Optional[dict]

class WorkflowLevelRead(WorkflowLevelBase):
    id: UUID
    workflow_id: UUID
    created_at: datetime
    updated_at: datetime

    roles: list["WorkflowLevelRoleRead"] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

