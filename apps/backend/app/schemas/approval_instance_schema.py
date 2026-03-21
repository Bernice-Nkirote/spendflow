from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional,List
from enum import Enum
from .approval_action_schema import ApprovalActionRead

class EntityTypeEnum(str, Enum):
    PR = "PR"
    PO = "PO"
    INVOICE = "INVOICE"
    PAYMENT = "PAYMENT"

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
    status: str
    created_at: datetime
    updated_at: datetime

    # Optional:nested actions
    actions: Optional[List["ApprovalActionRead"]] = []
    model_config = ConfigDict(from_attributes=True)