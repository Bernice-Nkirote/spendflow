from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_supplier
from app.core.database import get_db
from app.models.enums import InvoiceStatusEnum
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.invoice_line_item_repository import InvoiceLineItemRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.audit_log_repository import AuditLogRepository

from app.schemas.invoice_line_item_schema import (
    InvoiceLineItemCreate,
    InvoiceLineItemRead,
    InvoiceLineItemUpdate,
)
from app.schemas.invoice_schema import InvoiceCreate, InvoiceRead, InvoiceUpdate
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.invoice_service import InvoiceService
from app.services.permission_service import PermissionService
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix="/supplier/invoices", tags=["Supplier Invoices"])


def get_supplier_invoice_service(
    db: Session = Depends(get_db),
) -> InvoiceService:
    invoice_repo = InvoiceRepository(db)
    line_item_repo = InvoiceLineItemRepository(db)
    purchase_order_repo = PurchaseOrderRepository(db)
    workflow_repo = ApprovalWorkflowRepository(db)

    approval_instance_repo = ApprovalInstanceRepository(db)
    workflow_level_repo = WorkflowLevelRepository(db)
    approval_instance_service = ApprovalInstanceService(
        repo=approval_instance_repo,
        workflow_level_repo=workflow_level_repo,
    )
    permission_service = PermissionService(
        permission_repo=PermissionRepository(db),
        role_permission_repo=RolePermissionRepository(db),
        role_repo=RoleRepository(db),
    )

    audit_log_service = AuditLogService(
        repo=AuditLogRepository(db),
    )

    return InvoiceService(
        invoice_repo=invoice_repo,
        line_item_repo=line_item_repo,
        purchase_order_repo=purchase_order_repo,
        workflow_repo=workflow_repo,
        approval_instance_service=approval_instance_service,
        permission_service=permission_service,
        audit_log_service=audit_log_service,
    )


def _ensure_supplier_owns_invoice(
    invoice_id: UUID,
    current_supplier,
    service: InvoiceService,
):
    invoice = service.get_invoice(
        invoice_id=invoice_id,
        company_id=current_supplier.supplier.company_id,
    )

    if invoice.supplier_id != current_supplier.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access another supplier's invoice",
        )

    return invoice


@router.post(
    "/",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_supplier_invoice(
    invoice_data: InvoiceCreate,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    return service.create_invoice(
        invoice_data=invoice_data,
        company_id=current_supplier.supplier.company_id,
        submitting_user=current_supplier,
    )


@router.get("/", response_model=list[InvoiceRead])
def get_all_supplier_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    return service.get_all_invoices_by_supplier(
        supplier_id=current_supplier.supplier_id,
        company_id=current_supplier.supplier.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/status/{status}", response_model=list[InvoiceRead])
def get_supplier_invoices_by_status(
    status: InvoiceStatusEnum,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    return service.get_all_invoices_by_status(
        invoice_status=status,
        company_id=current_supplier.supplier.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{invoice_id}", response_model=InvoiceRead)
def get_supplier_invoice(
    invoice_id: UUID,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    return _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        service=service,
    )


@router.put("/{invoice_id}", response_model=InvoiceRead)
def update_supplier_invoice(
    invoice_id: UUID,
    invoice_data: InvoiceUpdate,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        service=service,
    )

    return service.update_invoice(
        invoice_id=invoice_id,
        invoice_data=invoice_data,
        company_id=current_supplier.supplier.company_id,
        actor_supplier_user_id=current_supplier.id,
    )


@router.patch("/{invoice_id}/submit", response_model=InvoiceRead)
def submit_supplier_invoice(
    invoice_id: UUID,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        service=service,
    )

    return service.submit_invoice(
        invoice_id=invoice_id,
        company_id=current_supplier.supplier.company_id,
        actor_supplier_user_id=current_supplier.id,
    )


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier_invoice(
    invoice_id: UUID,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        service=service,
    )

    service.delete_invoice(
        invoice_id=invoice_id,
        company_id=current_supplier.supplier.company_id,
        actor_supplier_user_id=current_supplier.id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{invoice_id}/items",
    response_model=InvoiceLineItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_supplier_invoice_line_item(
    invoice_id: UUID,
    item_data: InvoiceLineItemCreate,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        service=service,
    )

    return service.create_invoice_line_item(
        invoice_id=invoice_id,
        item_data=item_data,
        company_id=current_supplier.supplier.company_id,
    )


@router.get(
    "/{invoice_id}/items",
    response_model=list[InvoiceLineItemRead],
)
def get_all_supplier_invoice_line_items(
    invoice_id: UUID,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        service=service,
    )

    return service.get_all_invoice_line_items(
        invoice_id=invoice_id,
        company_id=current_supplier.supplier.company_id,
    )


@router.put(
    "/{invoice_id}/items/{item_id}",
    response_model=InvoiceLineItemRead,
)
def update_supplier_invoice_line_item(
    invoice_id: UUID,
    item_id: UUID,
    item_data: InvoiceLineItemUpdate,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        service=service,
    )

    return service.update_invoice_line_item(
        item_id=item_id,
        item_data=item_data,
        company_id=current_supplier.supplier.company_id,
    )


@router.delete(
    "/{invoice_id}/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_supplier_invoice_line_item(
    invoice_id: UUID,
    item_id: UUID,
    current_supplier=Depends(get_current_supplier),
    service: InvoiceService = Depends(get_supplier_invoice_service),
):
    _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        service=service,
    )

    service.delete_invoice_line_item(
        item_id=item_id,
        company_id=current_supplier.supplier.company_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)