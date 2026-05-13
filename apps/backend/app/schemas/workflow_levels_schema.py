from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from .workflowlevel_role_schema import WorkflowLevelRoleRead


class WorkflowLevelCreate(BaseModel):
    # Workflow this level belongs to
    workflow_id: UUID

    # Position in the approval flow
    level_order: int

    # Label shown to users
    name: str

    # Optional amount range for this level
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None

    # Department responsible for this level
    department_id: UUID

    # Optional extra rule data
    condition_expression: Optional[dict] = None

    @field_validator("max_amount")
    @classmethod
    def validate_amounts(cls, v, info):
        min_amount = info.data.get("min_amount")
        if min_amount is not None and v is not None and v < min_amount:
            raise ValueError("max_amount must be greater than or equal to min_amount")
        return v


class WorkflowLevelUpdate(BaseModel):
    # All fields optional for partial update
    name: Optional[str] = None
    level_order: Optional[int] = None
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    department_id: Optional[UUID] = None
    condition_expression: Optional[dict] = None

    @field_validator("max_amount")
    @classmethod
    def validate_amounts(cls, v, info):
        min_amount = info.data.get("min_amount")
        if min_amount is not None and v is not None and v < min_amount:
            raise ValueError("max_amount must be greater than or equal to min_amount")
        return v


class WorkflowLevelRead(BaseModel):
    id: UUID
    workflow_id: UUID
    company_id: UUID
    level_order: int
    name: str
    min_amount: Optional[Decimal] = None
    max_amount: Optional[Decimal] = None
    department_id: UUID
    workflow_name: Optional[str] = None
    department_name: Optional[str] = None
    condition_expression: Optional[dict] = None
    created_at: datetime
    updated_at: datetime

    # Roles allowed to act at this level
    level_roles: list[WorkflowLevelRoleRead] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)