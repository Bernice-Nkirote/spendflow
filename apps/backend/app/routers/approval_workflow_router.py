from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.schemas.approval_workflows_schema import (
    ApprovalWorkflowCreate,
    ApprovalWorkflowRead,
    ApprovalWorkflowUpdate,
)
from app.services.approval_workflow_service import ApprovalWorkflowService


router = APIRouter(prefix="/workflows", tags=["Approval Workflows"])


def get_service(db: Session = Depends(get_db)) -> ApprovalWorkflowService:
    """
    Build ApprovalWorkflowService with repository.
    """
    return ApprovalWorkflowService(
        repo=ApprovalWorkflowRepository(db)
    )


@router.post("/", response_model=ApprovalWorkflowRead, status_code=status.HTTP_201_CREATED)
def create_workflow(
    workflow: ApprovalWorkflowCreate,
    service: ApprovalWorkflowService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Create a workflow for the current company.
    """
    return service.create_workflow(workflow, user.company_id)


@router.get("/", response_model=List[ApprovalWorkflowRead])
def get_all_workflows(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    service: ApprovalWorkflowService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get all workflows for the current company.
    """
    return service.get_all_workflows(
        company_id=user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{workflow_id}", response_model=ApprovalWorkflowRead)
def get_workflow(
    workflow_id: UUID,
    service: ApprovalWorkflowService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get one workflow for the current company.
    """
    return service.get_workflow(workflow_id, user.company_id)


@router.put("/{workflow_id}", response_model=ApprovalWorkflowRead)
def update_workflow(
    workflow_id: UUID,
    workflow_data: ApprovalWorkflowUpdate,
    service: ApprovalWorkflowService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Update a workflow for the current company.
    """
    return service.update_workflow(
        workflow_id=workflow_id,
        workflow_data=workflow_data,
        company_id=user.company_id,
    )


@router.patch("/{workflow_id}/deactivate", response_model=ApprovalWorkflowRead)
def deactivate_workflow(
    workflow_id: UUID,
    service: ApprovalWorkflowService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Deactivate a workflow for the current company.
    """
    return service.deactivate_workflow(workflow_id, user.company_id)


@router.patch("/{workflow_id}/activate", response_model=ApprovalWorkflowRead)
def activate_workflow(
    workflow_id: UUID,
    service: ApprovalWorkflowService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Activate a workflow for the current company.
    """
    return service.activate_workflow(workflow_id, user.company_id)


@router.delete("/{workflow_id}")
def delete_workflow(
    workflow_id: UUID,
    service: ApprovalWorkflowService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Delete a workflow for the current company.
    """
    return service.delete_workflow(workflow_id, user.company_id)