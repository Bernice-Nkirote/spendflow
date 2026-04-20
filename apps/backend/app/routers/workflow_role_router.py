import uuid
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository
from app.schemas.workflowlevel_role_schema import (
    WorkflowLevelRoleCreate,
    WorkflowLevelRoleRead,
    WorkflowLevelRoleUpdate,
)
from app.services.workflow_role_service import WorkflowLevelRoleService


router = APIRouter(
    prefix="/workflow-level-roles",
    tags=["Workflow Level Roles"],
)


def get_service(
    db: Session = Depends(get_db),
) -> WorkflowLevelRoleService:
    """
    Build WorkflowLevelRoleService with required repositories.
    """
    return WorkflowLevelRoleService(
        repo=WorkflowLevelRoleRepository(db),
        workflow_level_repo=WorkflowLevelRepository(db),
    )


@router.post("/", response_model=WorkflowLevelRoleRead)
def create_workflow_level_role(
    data: WorkflowLevelRoleCreate,
    service: WorkflowLevelRoleService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Assign a role to a workflow level.
    """
    return service.create_workflow_level_role(data, user.company_id)


@router.get("/", response_model=List[WorkflowLevelRoleRead])
def get_all_workflow_level_roles(
    service: WorkflowLevelRoleService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get all workflow level role assignments.
    """
    return service.get_all_workflow_level_roles(user.company_id)


@router.get("/level/{level_id}", response_model=List[WorkflowLevelRoleRead])
def get_roles_by_level(
    level_id: uuid.UUID,
    service: WorkflowLevelRoleService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get role assignments for one workflow level.
    """
    return service.get_roles_by_level(level_id, user.company_id)


@router.get("/{workflow_level_role_id}", response_model=WorkflowLevelRoleRead)
def get_workflow_level_role(
    workflow_level_role_id: uuid.UUID,
    service: WorkflowLevelRoleService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get one workflow level role assignment.
    """
    return service.get_workflow_level_role(
        workflow_level_role_id,
        user.company_id,
    )


@router.put("/{workflow_level_role_id}", response_model=WorkflowLevelRoleRead)
def update_workflow_level_role(
    workflow_level_role_id: uuid.UUID,
    data: WorkflowLevelRoleUpdate,
    service: WorkflowLevelRoleService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Update one workflow level role assignment.
    """
    return service.update_workflow_level_role(
        workflow_level_role_id,
        data,
        user.company_id,
    )


@router.delete("/{workflow_level_role_id}")
def delete_workflow_level_role(
    workflow_level_role_id: uuid.UUID,
    service: WorkflowLevelRoleService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Delete one workflow level role assignment.
    """
    return service.delete_workflow_level_role(
        workflow_level_role_id,
        user.company_id,
    )