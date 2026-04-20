from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EntityTypeEnum
from .workflow_levels_schema import WorkflowLevelRead


class ApprovalWorkflowCreate(BaseModel):
    # Workflow name shown to users
    name: str

    # Type of record this workflow applies to
    entity_type: EntityTypeEnum


class ApprovalWorkflowUpdate(BaseModel):
    # All fields optional for partial updates
    name: Optional[str] = None
    entity_type: Optional[EntityTypeEnum] = None
    is_active: Optional[bool] = None


class ApprovalWorkflowRead(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    entity_type: EntityTypeEnum
    is_active: bool
    created_at: datetime
    updated_at: datetime

    # Included for visibility when returning a workflow with its levels
    levels: list[WorkflowLevelRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)