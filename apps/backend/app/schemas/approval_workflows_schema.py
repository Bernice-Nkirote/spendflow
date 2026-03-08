from pydantic import BaseModel,ConfigDict,Field
from uuid import UUID
from datetime import datetime
from typing import Optional
from workflow_levels_schema import WorkflowLevelRead
from enum import Enum

class EntityTypeEnum(str, Enum):
    PR = "PR"
    PO = "PO"
    INVOICE = "INVOICE"
    PAYMENT = "PAYMENT"

class ApprovalWorkflowBase(BaseModel):
    name:str
    entity_type: EntityTypeEnum

class ApprovalWorkflowCreate(ApprovalWorkflowBase):
    company_id: UUID

class ApprovalWorkflowUpdate(BaseModel):
    name: Optional[str] 
    entity_type:Optional[EntityTypeEnum] 
    is_active:Optional[bool]

class ApprovalWorkflowRead(ApprovalWorkflowBase):
    id:UUID
    company_id:UUID
    entity_type: EntityTypeEnum
    is_active:bool
    created_at:datetime
    updated_at:datetime
# Optional nested levels 
    levels: list["WorkflowLevelRead"] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)

