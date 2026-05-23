from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.models.enums import PRStatusEnum
from app.repositories.company_repository import CompanyRepository
from app.repositories.exchange_rate_repository import ExchangeRateRepository
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.pr_item_repository import PurchaseRequisitionItemRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.pr_item_schema import (
    PurchaseRequisitionItemCreate,
    PurchaseRequisitionItemRead,
    PurchaseRequisitionItemUpdate,
)
from app.schemas.pr_schema import (
    PurchaseRequisitionCreate,
    PurchaseRequisitionRead,
    PurchaseRequisitionPaginatedRead,
    PurchaseRequisitionDetailRead,
    PurchaseRequisitionUpdate,
)
from app.services.exchange_rate_service import ExchangeRateService
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.pr_service import PurchaseRequisitionService
from app.services.permission_service import PermissionService
from app.services.audit_log_service import AuditLogService


router = APIRouter(
    prefix="/purchase-requisitions",
    tags=["Purchase Requisitions"],
)


def get_purchase_requisition_service(
    db: Session = Depends(get_db),
) -> PurchaseRequisitionService:
    requisition_repo = PurchaseRequisitionRepository(db)
    item_repo = PurchaseRequisitionItemRepository(db)
    workflow_repo = ApprovalWorkflowRepository(db)
    company_repo = CompanyRepository(db)
    exchange_rate_repo = ExchangeRateRepository(db)

    exchange_rate_service = ExchangeRateService(
        repo=exchange_rate_repo,
        company_repo=company_repo,
    )

    approval_instance_repo = ApprovalInstanceRepository(db)
    workflow_level_repo = WorkflowLevelRepository(db)
    approval_instance_service = ApprovalInstanceService(
        repo=approval_instance_repo,
        workflow_level_repo=workflow_level_repo,
        pr_repo=PurchaseRequisitionRepository(db),
        po_repo=PurchaseOrderRepository(db),
        invoice_repo=InvoiceRepository(db),
        payment_repo=PaymentRepository(db),
    )

    audit_log_service = AuditLogService(
        repo=AuditLogRepository(db)
    )

    permission_service = PermissionService(
        permission_repo=PermissionRepository(db),
        role_permission_repo=RolePermissionRepository(db),
        role_repo=RoleRepository(db),
        audit_log_service=audit_log_service,
    )
    

    return PurchaseRequisitionService(
        requisition_repo=requisition_repo,
        item_repo=item_repo,
        workflow_repo=workflow_repo,
        approval_instance_service=approval_instance_service,
        permission_service=permission_service,
        audit_log_service=audit_log_service,
        exchange_rate_service=exchange_rate_service,
    )


@router.post(
    "/",
    response_model=PurchaseRequisitionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_purchase_requisition(
    requisition_data: PurchaseRequisitionCreate,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.create_purchase_requisition(
        requisition_data=requisition_data,
        user_id=current_user.id,
        role_id=current_user.role_id,
        company_id=current_user.company_id,
    )


@router.get("/", response_model=list[PurchaseRequisitionRead])
def get_all_purchase_requisitions(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.get_all_purchase_requisitions(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/paginated",
    response_model=PurchaseRequisitionPaginatedRead,
)
def get_all_purchase_requisitions_paginated(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(
        get_purchase_requisition_service
    ),
):
    return service.get_all_purchase_requisitions_paginated(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )

@router.get("/status/{status}", response_model=list[PurchaseRequisitionRead])
def get_purchase_requisitions_by_status(
    status: PRStatusEnum,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.get_all_purchase_requisitions_by_status(
        pr_status=status,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/department/{department_id}", response_model=list[PurchaseRequisitionRead])
def get_purchase_requisitions_by_department(
    department_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.get_all_purchase_requisitions_by_department(
        department_id=department_id,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{requisition_id}", response_model=PurchaseRequisitionDetailRead)
def get_purchase_requisition(
    requisition_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.get_purchase_requisition(
        requisition_id=requisition_id,
        company_id=current_user.company_id,
    )


@router.put("/{requisition_id}", response_model=PurchaseRequisitionRead)
def update_purchase_requisition(
    requisition_id: UUID,
    requisition_data: PurchaseRequisitionUpdate,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.update_purchase_requisition(
        requisition_id=requisition_id,
        requisition_data=requisition_data,
        company_id=current_user.company_id,
        user_id=current_user.id,
    )


@router.post(
    "/{requisition_id}/items",
    response_model=PurchaseRequisitionItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_purchase_requisition_item(
    requisition_id: UUID,
    item_data: PurchaseRequisitionItemCreate,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.create_purchase_requisition_item(
        requisition_id=requisition_id,
        item_data=item_data,
        company_id=current_user.company_id,
    )


@router.get(
    "/{requisition_id}/items",
    response_model=list[PurchaseRequisitionItemRead],
)
def get_all_purchase_requisition_items(
    requisition_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.get_all_purchase_requisition_items(
        requisition_id=requisition_id,
        company_id=current_user.company_id,
    )


@router.put(
    "/{requisition_id}/items/{item_id}",
    response_model=PurchaseRequisitionItemRead,
)
def update_purchase_requisition_item(
    requisition_id: UUID,
    item_id: UUID,
    item_data: PurchaseRequisitionItemUpdate,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.update_purchase_requisition_item(
        requisition_id=requisition_id,
        item_id=item_id,
        item_data=item_data,
        company_id=current_user.company_id,
    )


@router.delete(
    "/{requisition_id}/items/{item_id}",
    response_model=PurchaseRequisitionItemRead,
)
def delete_purchase_requisition_item(
    requisition_id: UUID,
    item_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.delete_purchase_requisition_item(
        requisition_id=requisition_id,
        item_id=item_id,
        company_id=current_user.company_id,
    )


@router.patch("/{requisition_id}/submit", response_model=PurchaseRequisitionRead)
def submit_purchase_requisition(
    requisition_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.submit_purchase_requisition(
        requisition_id=requisition_id,
        role_id=current_user.role_id,
        company_id=current_user.company_id,
        user_id=current_user.id,
    )


@router.patch("/{requisition_id}/cancel", response_model=PurchaseRequisitionRead)
def cancel_purchase_requisition(
    requisition_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseRequisitionService = Depends(get_purchase_requisition_service),
):
    return service.cancel_purchase_requisition(
        requisition_id=requisition_id,
        role_id=current_user.role_id,
        company_id=current_user.company_id,
        user_id=current_user.id,
    )