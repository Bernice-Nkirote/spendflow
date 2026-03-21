from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.schemas.workflow_levels_schema import WorkflowLevelCreate, WorkflowLevelRead
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.services.workflow_level_service import WorkflowLevelService
from app.core.auth_dependancy import get_current_user

router = APIRouter(prefix="/workflow-levels", tags=["Workflow Levels"])

repo = WorkflowLevelRepository()
service = WorkflowLevelService(repo=repo)

@router.post("/", response_model=WorkflowLevelRead)
def create_level(
    level: WorkflowLevelCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return service.create_level(
        db,
        level,
        user["company_id"]
    )

@router.get("/by-workflow/{workflow_id}", response_model=List[WorkflowLevelRead])
def list_levels(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return service.list_levels(
        db,
        workflow_id,
        user["company_id"]
    )

@router.get("/{level_id}", response_model=WorkflowLevelRead)
def get_level(
    level_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    level = service.get_level(db, level_id, user["company_id"])

    if not level:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow level not found"
        )

    return level