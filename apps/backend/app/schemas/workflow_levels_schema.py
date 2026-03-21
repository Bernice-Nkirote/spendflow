from pydantic import BaseModel,ConfigDict,Field, field_validator
from uuid import UUID
from datetime import datetime
from typing import Optional
from decimal import Decimal
from .workflowlevel_role_schema import WorkflowLevelRoleRead

class WorkflowLevelBase(BaseModel):
    level_order: int
    name:str
    min_amount: Optional[Decimal]
    max_amount: Optional[Decimal]
    department_id: UUID
    condition_expression: Optional[dict]

    #  Validator
    @field_validator("max_amount")
    def validate_amounts(cls, v, values):
        min_amount = values.data.get("min_amount")

        if min_amount is not None and v is not None and v < min_amount:
            raise ValueError("max_amount must be greater than min_amount")
        return v


class WorkflowLevelCreate(WorkflowLevelBase):
    # For frontend to show which workflow this level belongs to, The id will be in dropdown and user will pick it
    workflow_id: UUID 

class WorkflowLevelUpdate(BaseModel):
    level_order: Optional[int]
    min_amount: Optional[Decimal]
    max_amount: Optional[Decimal]
    department_id: Optional[UUID]
    condition_expression: Optional[dict]

class WorkflowLevelRead(WorkflowLevelBase):
    id: UUID
    workflow_id: UUID
    created_at: datetime
    updated_at: datetime

    roles: list["WorkflowLevelRoleRead"] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)

