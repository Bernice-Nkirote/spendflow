from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ApprovalWorkflowBase(BaseModel):
    name:str

class ApprovalWorkflowCreate(ApprovalWorkflowBase):
    company_id: UUID

class ApprovalWorkflowUpdate(BaseModel):
    name: Optional[str]
    is_active:Optional[bool]

class ApprovalWorkflowRead(ApprovalWorkflowBase):
    id:UUID
    company_id:UUID
    is_active:bool
    created_at:datetime
    updated_at:datetime
# Optional nested levels 
levels: Optional[list["WorkflowLevelRead"]] = []

model_config = {
    "from_attributes":True
}