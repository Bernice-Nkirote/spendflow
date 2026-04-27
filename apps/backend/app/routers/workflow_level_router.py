from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_admin_user
from app.core.database import get_db
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.schemas.workflow_levels_schema import WorkflowLevelCreate, WorkflowLevelRead
from app.services.workflow_level_service import WorkflowLevelService


router = APIRouter(
    prefix="/workflow-levels",
    tags=["Workflow Levels"],
    dependencies=[Depends(get_current_admin_user)],
)


def get_service(db: Session = Depends(get_db)) -> WorkflowLevelService:
    workflow_level_repo = WorkflowLevelRepository(db)
    workflow_repo = ApprovalWorkflowRepository(db)

    return WorkflowLevelService(
        repo=workflow_level_repo,
        workflow_repo=workflow_repo,
    )


@router.post("/", response_model=WorkflowLevelRead)
def create_level(
    level: WorkflowLevelCreate,
    service: WorkflowLevelService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.create_level(level, current_user.company_id)


@router.get("/by-workflow/{workflow_id}", response_model=List[WorkflowLevelRead])
def list_levels(
    workflow_id: UUID,
    service: WorkflowLevelService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.list_levels(workflow_id, current_user.company_id)


@router.get("/{level_id}", response_model=WorkflowLevelRead)
def get_level(
    level_id: UUID,
    service: WorkflowLevelService = Depends(get_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_level(level_id, current_user.company_id)