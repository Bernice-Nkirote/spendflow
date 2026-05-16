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
    entity_reference: Optional[str] = None
    entity_title: Optional[str] = None
    requester_name: Optional[str] = None
    total_amount: Optional[float] = None
    currency: Optional[str] = None

    exchange_rate: Optional[float] = None
    base_currency: Optional[str] = None
    base_amount: Optional[float] = None
    exchange_rate_date: Optional[datetime] = None

    workflow_name: Optional[str] = None
    current_level_id: Optional[UUID]
    current_level_name: Optional[str] = None
    status: ApprovalStatus
    company_id: UUID
    created_at: datetime
    updated_at: datetime
    actions: List[ApprovalActionRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)