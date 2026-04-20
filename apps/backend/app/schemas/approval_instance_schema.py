from datetime import datetime
from typing import Optional, List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import EntityTypeEnum, ApprovalStatus
from .approval_action_schema import ApprovalActionRead


class ApprovalInstanceCreate(BaseModel):
    workflow_id: UUID
    entity_id: UUID
    entity_type: EntityTypeEnum


class ApprovalInstanceRead(BaseModel):
    id: UUID
    workflow_id: UUID
    entity_id: UUID
    entity_type: EntityTypeEnum
    current_level_id: Optional[UUID]
    status: ApprovalStatus
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    actions: List[ApprovalActionRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)