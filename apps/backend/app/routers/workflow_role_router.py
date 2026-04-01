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
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository
from app.core.auth_dependancy import get_current_user

router = APIRouter(prefix="/workflow-level-roles", tags=["Workflow Level Roles"])

# Create Dependency for scalability
def get_workflow_role_service(
        db:Session = Depends(get_db)
)-> WorkflowLevelRoleService:
    repo=WorkflowLevelRoleRepository()
    return WorkflowLevelRoleService(repo)

# CREATE
@router.post("/", response_model=WorkflowLevelRoleRead)
def create_workflow_level_role(
    data: WorkflowLevelRoleCreate,
    service: WorkflowLevelRoleService=Depends(get_workflow_role_service),
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return service.create_workflow_level_role(
        db, 
        data,
        user["company_id"])

# GET ALL
@router.get("/", response_model=List[WorkflowLevelRoleRead])
def get_all_workflow_level_roles(
    service: WorkflowLevelRoleService = Depends(get_workflow_role_service),
    db: Session = Depends(get_db)
):
    return service.get_all_workflow_level_roles(db)

# GET BY LEVEL
@router.get("/level/{level_id}", response_model=List[WorkflowLevelRoleRead])
def get_roles_by_level(
    level_id: uuid.UUID,
    service: WorkflowLevelRoleService=Depends(get_workflow_role_service),
    db: Session = Depends(get_db)
):
    return service.get_roles_by_level(db, level_id)

# GET ONE
@router.get("/{role_id}", response_model=WorkflowLevelRoleRead)
def get_workflow_level_role(
    role_id: uuid.UUID,
    service: WorkflowLevelRoleService=Depends(get_workflow_role_service),
    db: Session = Depends(get_db)
):
    return service.get_workflow_level_role(db, role_id)

# UPDATE
@router.put("/{role_id}", response_model=WorkflowLevelRoleRead)
def update_workflow_level_role(
    role_id: uuid.UUID,
    data: WorkflowLevelRoleUpdate,
    service: WorkflowLevelRoleService=Depends(get_workflow_role_service),
    db: Session = Depends(get_db)
):
    return service.update_workflow_level_role(db, role_id, data)

# DELETE
@router.delete("/{role_id}")
def delete_workflow_level_role(
    role_id: uuid.UUID,
    service: WorkflowLevelRoleService=Depends(get_workflow_role_service),
    db: Session = Depends(get_db)
):
    return service.delete_workflow_level_role(db, role_id)