from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.schemas.workflow_levels_schema import WorkflowLevelCreate, WorkflowLevelRead
from app.services.workflow_level_service import WorkflowLevelService


router = APIRouter(prefix="/workflow-levels", tags=["Workflow Levels"])


def get_service(db: Session = Depends(get_db)) -> WorkflowLevelService:
    """
    Build service per request with all required repositories.
    """
    workflow_level_repo = WorkflowLevelRepository(db)
    workflow_repo = ApprovalWorkflowRepository(db)
    return WorkflowLevelService(
        repo=workflow_level_repo,
        workflow_repo=workflow_repo
    )


@router.post("/", response_model=WorkflowLevelRead)
def create_level(
    level: WorkflowLevelCreate,
    service: WorkflowLevelService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Create a workflow level for the current user's company.
    """
    return service.create_level(level, user.company_id)


@router.get("/by-workflow/{workflow_id}", response_model=List[WorkflowLevelRead])
def list_levels(
    workflow_id: UUID,
    service: WorkflowLevelService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    List all workflow levels for a workflow belonging to the current user's company.
    """
    return service.list_levels(workflow_id, user.company_id)


@router.get("/{level_id}", response_model=WorkflowLevelRead)
def get_level(
    level_id: UUID,
    service: WorkflowLevelService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get one workflow level belonging to the current user's company.
    """
    return service.get_level(level_id, user.company_id)