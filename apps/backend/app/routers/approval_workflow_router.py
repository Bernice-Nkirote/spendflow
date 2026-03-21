from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.schemas.approval_workflows_schema import ApprovalWorkflowCreate, ApprovalWorkflowRead
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.services.approval_workflow_service import ApprovalWorkflowService
from app.core.auth_dependancy import get_current_user

router = APIRouter(prefix="/workflows", tags=["Approval Workflows"])

repo = ApprovalWorkflowRepository()
service = ApprovalWorkflowService(repo=repo)

@router.post("/", response_model=ApprovalWorkflowRead, operation_id="createWorkflow")
def create_workflow(
    workflow: ApprovalWorkflowCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    return service.create_workflow(db, workflow, user["company_id"])

@router.get("/", response_model=List[ApprovalWorkflowRead])
def list_workflows(
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    return service.list_workflows(db, user["company_id"])

@router.get("/{workflow_id}", response_model=ApprovalWorkflowRead)
def get_workflow(
    workflow_id: UUID,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
   return service.get_workflow(
        db,
        workflow_id,
        user["company_id"]
    )