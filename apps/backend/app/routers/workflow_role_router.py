import uuid
from uuid import UUID
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_admin_user
from app.core.database import get_db
from app.repositories.role_repository import RoleRepository
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
    dependencies=[Depends(get_current_admin_user)],
)


def get_service(
    db: Session = Depends(get_db),
) -> WorkflowLevelRoleService:
    return WorkflowLevelRoleService(
        repo=WorkflowLevelRoleRepository(db),
        workflow_level_repo=WorkflowLevelRepository(db),
        role_repo=RoleRepository(db),
    )


@router.post("/", response_model=WorkflowLevelRoleRead)
def create_workflow_level_role(
    data: WorkflowLevelRoleCreate,
    service: WorkflowLevelRoleService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.create_workflow_level_role(data, current_user.company_id)


@router.get("/", response_model=List[WorkflowLevelRoleRead])
def get_all_workflow_level_roles(
    service: WorkflowLevelRoleService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_all_workflow_level_roles(current_user.company_id)


@router.get("/level/{level_id}", response_model=List[WorkflowLevelRoleRead])
def get_roles_by_level(
    level_id: UUID,
    service: WorkflowLevelRoleService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_roles_by_level(level_id, current_user.company_id)


@router.get("/{workflow_level_role_id}", response_model=WorkflowLevelRoleRead)
def get_workflow_level_role(
    workflow_level_role_id: UUID,
    service: WorkflowLevelRoleService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_workflow_level_role(
        workflow_level_role_id,
        current_user.company_id,
    )


@router.put("/{workflow_level_role_id}", response_model=WorkflowLevelRoleRead)
def update_workflow_level_role(
    workflow_level_role_id:UUID,
    data: WorkflowLevelRoleUpdate,
    service: WorkflowLevelRoleService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.update_workflow_level_role(
        workflow_level_role_id,
        data,
        current_user.company_id,
    )


@router.delete("/{workflow_level_role_id}")
def delete_workflow_level_role(
    workflow_level_role_id: UUID,
    service: WorkflowLevelRoleService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.delete_workflow_level_role(
        workflow_level_role_id,
        current_user.company_id,
    )