from pydantic import BaseModel,ConfigDict,Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from .workflow_levels_schema import WorkflowLevelRead
from app.models.enums import EntityTypeEnum


class ApprovalWorkflowBase(BaseModel):
    name:str
    entity_type: EntityTypeEnum

class ApprovalWorkflowCreate(ApprovalWorkflowBase):
    pass

class ApprovalWorkflowUpdate(BaseModel):
    name: Optional[str] 
    entity_type:Optional[EntityTypeEnum] 
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

