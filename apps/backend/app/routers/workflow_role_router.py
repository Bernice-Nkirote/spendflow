import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.services.workflow_role_service import WorkflowLevelRoleService
from app.schemas.workflowlevel_role_schema import (
    WorkflowLevelRoleCreate,
    WorkflowLevelRoleUpdate,
    WorkflowLevelRoleRead
)
from app.core.auth_dependancy import get_current_user

router = APIRouter(prefix="/workflow-level-roles", tags=["Workflow Level Roles"])

service = WorkflowLevelRoleService()


@router.post("/", response_model=WorkflowLevelRoleRead)
def create_workflow_level_role(
    data: WorkflowLevelRoleCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return service.create_workflow_level_role(
        db, 
        data,
        user["company_id"])


@router.get("/", response_model=List[WorkflowLevelRoleRead])
def get_all_workflow_level_roles(db: Session = Depends(get_db)):
    return service.get_all_workflow_level_roles(db)


@router.get("/level/{level_id}", response_model=List[WorkflowLevelRoleRead])
def get_roles_by_level(
    level_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.get_roles_by_level(db, level_id)

@router.get("/{role_id}", response_model=WorkflowLevelRoleRead)
def get_workflow_level_role(
    role_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.get_workflow_level_role(db, role_id)


@router.put("/{role_id}", response_model=WorkflowLevelRoleRead)
def update_workflow_level_role(
    role_id: uuid.UUID,
    data: WorkflowLevelRoleUpdate,
    db: Session = Depends(get_db)
):
    return service.update_workflow_level_role(db, role_id, data)


@router.delete("/{role_id}")
def delete_workflow_level_role(
    role_id: uuid.UUID,
    db: Session = Depends(get_db)
):
    return service.delete_workflow_level_role(db, role_id)