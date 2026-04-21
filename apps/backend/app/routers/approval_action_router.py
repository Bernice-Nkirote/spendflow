from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.approval_action_repository import ApprovalActionRepository
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository
from app.schemas.approval_action_schema import (
    ApprovalActionCreate,
    ApprovalActionRead,
)
from app.services.approval_action_service import ApprovalActionService


router = APIRouter(prefix="/approval-actions", tags=["Approval Actions"])


def get_service(db: Session = Depends(get_db)) -> ApprovalActionService:
    return ApprovalActionService(
        action_repo=ApprovalActionRepository(db),
        instance_repo=ApprovalInstanceRepository(db),
        level_role_repo=WorkflowLevelRoleRepository(db),
        workflow_level_repo=WorkflowLevelRepository(db),
        pr_repo=PurchaseRequisitionRepository(db),
        po_repo=PurchaseOrderRepository(db),
    )


@router.post("/", response_model=ApprovalActionRead)
def create_action(
    approval_action: ApprovalActionCreate,
    service: ApprovalActionService = Depends(get_service),
    user=Depends(get_current_user),
):
    return service.create_action(approval_action, user)


@router.get("/{action_id}", response_model=ApprovalActionRead)
def get_action(
    action_id: UUID,
    service: ApprovalActionService = Depends(get_service),
    user=Depends(get_current_user),
):
    return service.get_action(action_id, user.company_id)


@router.get("/", response_model=List[ApprovalActionRead])
def get_all_actions(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    service: ApprovalActionService = Depends(get_service),
    user=Depends(get_current_user),
):
    return service.get_all_actions(
        company_id=user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/instance/{instance_id}", response_model=List[ApprovalActionRead])
def get_actions_by_instance(
    instance_id: UUID,
    service: ApprovalActionService = Depends(get_service),
    user=Depends(get_current_user),
):
    return service.get_actions_by_instance(instance_id, user.company_id)