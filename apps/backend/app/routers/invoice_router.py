from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.models.enums import InvoiceStatusEnum
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.invoice_line_item_repository import InvoiceLineItemRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.invoice_line_item_schema import (
    InvoiceLineItemCreate,
    InvoiceLineItemRead,
    InvoiceLineItemUpdate,
)
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.exchange_rate_repository import ExchangeRateRepository
from app.schemas.invoice_schema import(
InvoiceCreate, 
InvoiceRead, 
InvoiceUpdate,
InvoiceDetailRead,
InvoicePaginatedRead,
)
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.invoice_service import InvoiceService
from app.services.permission_service import PermissionService
from app.services.audit_log_service import AuditLogService
from app.services.exchange_rate_service import ExchangeRateService

router = APIRouter(prefix="/invoices", tags=["Invoices"])


def get_invoice_service(
    db: Session = Depends(get_db),
) -> InvoiceService:
    invoice_repo = InvoiceRepository(db)
    line_item_repo = InvoiceLineItemRepository(db)
    purchase_order_repo = PurchaseOrderRepository(db)
    pr_repo = PurchaseRequisitionRepository(db)
    workflow_repo = ApprovalWorkflowRepository(db)
    approval_instance_repo = ApprovalInstanceRepository(db)
    workflow_level_repo = WorkflowLevelRepository(db)
    company_repo = CompanyRepository(db)
    exchange_rate_repo = ExchangeRateRepository(db)

    exchange_rate_service = ExchangeRateService(
        repo=exchange_rate_repo,
        company_repo=company_repo,
    )
    
    approval_instance_service = ApprovalInstanceService(
        repo=approval_instance_repo,
        workflow_level_repo=workflow_level_repo,
        pr_repo=pr_repo,
        po_repo=purchase_order_repo,
        invoice_repo=invoice_repo,
        payment_repo=PaymentRepository(db),
    )

    audit_log_service = AuditLogService(
        repo=AuditLogRepository(db),
    )

    permission_service = PermissionService(
        permission_repo=PermissionRepository(db),
        role_permission_repo=RolePermissionRepository(db),
        role_repo=RoleRepository(db),
        audit_log_service=audit_log_service,
    )
    
    return InvoiceService(
        invoice_repo=invoice_repo,
        line_item_repo=line_item_repo,
        purchase_order_repo=purchase_order_repo,
        workflow_repo=workflow_repo,
        approval_instance_service=approval_instance_service,
        permission_service=permission_service,
        audit_log_service=audit_log_service,
        exchange_rate_service=exchange_rate_service,
    )


@router.post(
    "/",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    invoice_data: InvoiceCreate,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.create_invoice(
        invoice_data=invoice_data,
        company_id=current_user.company_id,
        submitting_user=current_user,
        role_id=current_user.role_id,
    )


@router.get("/", response_model=list[InvoiceDetailRead])
def get_all_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.get_all_invoices(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )

@router.get(
    "/paginated",
    response_model=InvoicePaginatedRead,
)
def get_all_invoices_paginated(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.get_all_invoices_paginated(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )

@router.get("/status/{status}", response_model=list[InvoiceDetailRead])
def get_invoices_by_status(
    status: InvoiceStatusEnum,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.get_all_invoices_by_status(
        invoice_status=status,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/supplier/{supplier_id}", response_model=list[InvoiceDetailRead])
def get_invoices_by_supplier(
    supplier_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.get_all_invoices_by_supplier(
        supplier_id=supplier_id,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/purchase-order/{purchase_order_id}", response_model=list[InvoiceDetailRead])
def get_invoices_by_purchase_order(
    purchase_order_id: UUID,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.get_all_invoices_by_purchase_order(
        purchase_order_id=purchase_order_id,
        company_id=current_user.company_id,
    )


@router.get("/{invoice_id}", response_model=InvoiceDetailRead)
def get_invoice(
    invoice_id: UUID,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.get_invoice(
        invoice_id=invoice_id,
        company_id=current_user.company_id,
    )


@router.put("/{invoice_id}", response_model=InvoiceRead)
def update_invoice(
    invoice_id: UUID,
    invoice_data: InvoiceUpdate,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.update_invoice(
        invoice_id=invoice_id,
        invoice_data=invoice_data,
        company_id=current_user.company_id,
        actor_user_id=current_user.id,
    )


@router.patch("/{invoice_id}/submit", response_model=InvoiceDetailRead)
def submit_invoice(
    invoice_id: UUID,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.submit_invoice(
        invoice_id=invoice_id,
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        actor_user_id=current_user.id,
    )


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: UUID,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    service.delete_invoice(
        invoice_id=invoice_id,
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        actor_user_id=current_user.id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{invoice_id}/items",
    response_model=InvoiceLineItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice_line_item(
    invoice_id: UUID,
    item_data: InvoiceLineItemCreate,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.create_invoice_line_item(
        invoice_id=invoice_id,
        item_data=item_data,
        company_id=current_user.company_id,
    )


@router.get(
    "/{invoice_id}/items",
    response_model=list[InvoiceLineItemRead],
)
def get_all_invoice_line_items(
    invoice_id: UUID,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.get_all_invoice_line_items(
        invoice_id=invoice_id,
        company_id=current_user.company_id,
    )


@router.put(
    "/{invoice_id}/items/{item_id}",
    response_model=InvoiceLineItemRead,
)
def update_invoice_line_item(
    invoice_id: UUID,
    item_id: UUID,
    item_data: InvoiceLineItemUpdate,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    return service.update_invoice_line_item(
        item_id=item_id,
        item_data=item_data,
        company_id=current_user.company_id,
    )


@router.delete(
    "/{invoice_id}/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_invoice_line_item(
    invoice_id: UUID,
    item_id: UUID,
    current_user=Depends(get_current_user),
    service: InvoiceService = Depends(get_invoice_service),
):
    service.delete_invoice_line_item(
        item_id=item_id,
        company_id=current_user.company_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)