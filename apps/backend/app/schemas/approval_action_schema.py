from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from app.models.enums import ActionType


class ApprovalActionCreate(BaseModel):
    # Approval instance being acted on
    instance_id: UUID

    # Workflow level where the action is taking place
    level_id: UUID

    # APPROVED or REJECTED
    action: ActionType

    # Optional comment from the approver
    comment: Optional[str] = None


class ApprovalActionRead(BaseModel):
    id: UUID
    company_id: UUID

    instance_id: UUID
    level_id: UUID
    user_id: UUID
    user_name: Optional[str] = None

    action: ActionType
    comment: Optional[str] = None

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)