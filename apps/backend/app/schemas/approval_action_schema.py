from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import Optional,List

class ApprovalActionCreate(BaseModel):
    instance_id: UUID
    level_id: UUID
    users_id: UUID
    action: str
    comment: Optional[str]

class ApprovalActionRead(BaseModel):
    id: UUID
    instance_id: UUID
    level_id: UUID
    users_id: UUID
    action: str
    comment: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
