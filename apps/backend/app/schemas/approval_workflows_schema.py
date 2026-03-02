from pydantic import BaseModel,ConfigDict,Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from workflow_levels_schema import WorkflowLevelRead

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
    levels: list["WorkflowLevelRead"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

