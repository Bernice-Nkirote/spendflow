from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional,List
from .approval_action_schema import ApprovalActionRead
from models.enums import EntityTypeEnum, ApprovalStatus

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
    created_at: datetime
    updated_at: datetime

    # Optional:nested actions
    actions: Optional[List["ApprovalActionRead"]] = []
    model_config = ConfigDict(from_attributes=True)