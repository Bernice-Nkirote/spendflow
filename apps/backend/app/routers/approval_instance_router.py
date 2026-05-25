import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.models.enums import ApprovalStatus
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.approval_instance_schema import (
    ApprovalInstanceCreate,
    ApprovalInstanceRead,
    PaginatedApprovalInstanceRead,
)
from app.services.approval_instance_service import ApprovalInstanceService


router = APIRouter(
    prefix="/approval-instances",
    tags=["Approval Instances"],
)


def get_service(db: Session = Depends(get_db)) -> ApprovalInstanceService:
    """
    Build ApprovalInstanceService with required repositories.
    """
    return ApprovalInstanceService(
    repo=ApprovalInstanceRepository(db),
    workflow_level_repo=WorkflowLevelRepository(db),
    pr_repo=PurchaseRequisitionRepository(db),
    po_repo=PurchaseOrderRepository(db),
    invoice_repo=InvoiceRepository(db),
    payment_repo=PaymentRepository(db),
)


@router.post("/", response_model=ApprovalInstanceRead)
def create_instance(
    data: ApprovalInstanceCreate,
    service: ApprovalInstanceService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Create an approval instance.
    """
    return service.create_instance(data, user.company_id)


@router.get("/", response_model=List[ApprovalInstanceRead])
def get_all_instances(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=200),
    service: ApprovalInstanceService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get all approval instances for the current company.
    """
    return service.get_all_instances(
        company_id=user.company_id,
        skip=skip,
        limit=limit,
    )

@router.get("/paginated", response_model=PaginatedApprovalInstanceRead)
def get_paginated_instances(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status_value: Optional[ApprovalStatus] = Query(None, alias="status"),
    exclude_status: Optional[ApprovalStatus] = Query(None),
    service: ApprovalInstanceService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get paginated approval instances for the current company.
    Use status for a specific queue, or exclude_status for history views.
    """
    return service.get_paginated_instances(
        company_id=user.company_id,
        skip=skip,
        limit=limit,
        status_value=status_value,
        exclude_status=exclude_status,
    )

@router.get("/my-queue", response_model=PaginatedApprovalInstanceRead)
def get_my_pending_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    service: ApprovalInstanceService = Depends(get_service),
    user=Depends(get_current_user),
):
    return service.get_my_pending_queue(
        company_id=user.company_id,
        role_id=user.role_id,
        department_id=user.department_id,
        skip=skip,
        limit=limit,
    )

@router.get("/{instance_id}", response_model=ApprovalInstanceRead)
def get_instance(
    instance_id: uuid.UUID,
    service: ApprovalInstanceService = Depends(get_service),
    user=Depends(get_current_user),
):
    """
    Get one approval instance.
    """
    return service.get_instance(instance_id, user.company_id)