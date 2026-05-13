from io import BytesIO
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.models.enums import POStatusEnum
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.po_item_repository import PurchaseOrderItemRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.po_email_log_repository import POEmailLogRepository
from app.repositories.pr_item_repository import PurchaseRequisitionItemRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.supplier_repository import SupplierRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.po_items_schema import (
    PurchaseOrderItemCreate,
    PurchaseOrderItemRead,
    PurchaseOrderItemUpdate,
    
)
from app.schemas.po_schema import (
    PurchaseOrderCreate,
    PurchaseOrderRead,
    PurchaseOrderUpdate,
    PurchaseOrderDetailRead,
)
from app.schemas.po_email_log_schema import POEmailLogRead
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.documents.pdf_service import PDFService
from app.services.notifications.email_service import EmailService
from app.services.orchestration.po_dispatch_service import PODispatchService
from app.services.orchestration.po_pdf_service import POPDFService
from app.services.orchestration.po_email_log_service import POEmailLogService
from app.services.po_service import PurchaseOrderService
from app.services.permission_service import PermissionService
from app.services.audit_log_service import AuditLogService

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

# GET PURCHASE ORDER SERVICES
def get_purchase_order_service(
    db: Session = Depends(get_db),
) -> PurchaseOrderService:
    po_repo = PurchaseOrderRepository(db)
    po_item_repo = PurchaseOrderItemRepository(db)
    pr_repo = PurchaseRequisitionRepository(db)
    pr_item_repo = PurchaseRequisitionItemRepository(db)
    invoice_repo = InvoiceRepository(db)
    payment_repo = PaymentRepository(db)
    workflow_repo = ApprovalWorkflowRepository(db)

    approval_instance_repo = ApprovalInstanceRepository(db)
    workflow_level_repo = WorkflowLevelRepository(db)
    approval_instance_service = ApprovalInstanceService(
        repo=approval_instance_repo,
        workflow_level_repo=workflow_level_repo,
        pr_repo=pr_repo,
        po_repo=po_repo,
        invoice_repo=invoice_repo,
        payment_repo=payment_repo,
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

    return PurchaseOrderService(
        po_repo=po_repo,
        po_item_repo=po_item_repo,
        pr_repo=pr_repo,
        pr_item_repo=pr_item_repo,
        workflow_repo=workflow_repo,
        approval_instance_service=approval_instance_service,
        permission_service=permission_service,
        audit_log_service=audit_log_service,
    )

# Get PO PDF SERVICE 
def get_po_pdf_service(
    db: Session = Depends(get_db),
) -> POPDFService:
    po_service = get_purchase_order_service(db)
    po_item_repo = PurchaseOrderItemRepository(db)
    supplier_repo = SupplierRepository(db)
    company_repo = CompanyRepository(db)
    pdf_service = PDFService()

    return POPDFService(
        po_service=po_service,
        po_item_repo=po_item_repo,
        supplier_repo=supplier_repo,
        company_repo=company_repo,
        pdf_service=pdf_service,
    )

# DISPATCH SERVICE FOR SENDING EMAIL TO SUPPLIER
def get_po_dispatch_service(
    db: Session = Depends(get_db),
) -> PODispatchService:

    # existing services
    po_service = get_purchase_order_service(db)

    po_item_repo = PurchaseOrderItemRepository(db)
    supplier_repo = SupplierRepository(db)
    po_email_log_repo = POEmailLogRepository(db)


    pdf_service = PDFService()

    email_service = EmailService(
        smtp_host=settings.SMTP_HOST,
        smtp_port=settings.SMTP_PORT,
        smtp_username=settings.SMTP_USERNAME,
        smtp_password=settings.SMTP_PASSWORD,
        from_email=settings.FROM_EMAIL,
        use_tls=settings.SMTP_USE_TLS,
    )

    return PODispatchService(
        po_service=po_service,
        po_item_repo=po_item_repo,
        supplier_repo=supplier_repo,
        pdf_service=pdf_service,
        email_service=email_service,
        po_email_log_repo=po_email_log_repo,

    )

# DEPENDENCY FOR EMAIL LOG SERVICE
def get_po_email_log_service(
    db: Session = Depends(get_db),
) -> POEmailLogService:
    po_service = get_purchase_order_service(db)
    po_email_log_repo = POEmailLogRepository(db)

    return POEmailLogService(
        po_service=po_service,
        po_email_log_repo=po_email_log_repo,
    )

# PURCHASE ORDER ROUTES
@router.post(
    "/",
    response_model=PurchaseOrderRead,
    status_code=status.HTTP_201_CREATED,
)
def create_purchase_order(
    po_data: PurchaseOrderCreate,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.create_po(
        po_data=po_data,
        company_id=current_user.company_id,
        created_by=current_user.id,
        role_id=current_user.role_id,
    )

@router.post(
    "/from-requisition/{requisition_id}",
    response_model=PurchaseOrderRead,
    status_code=status.HTTP_201_CREATED,
)
def create_purchase_order_from_requisition(
    requisition_id: UUID,
    po_data: PurchaseOrderCreate,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.create_po_from_pr(
        requisition_id=requisition_id,
        po_data=po_data,
        company_id=current_user.company_id,
        created_by=current_user.id,
        role_id=current_user.role_id,
    )


@router.get("/", response_model=list[PurchaseOrderDetailRead])
def get_all_purchase_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.get_all_pos(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/status/{status}", response_model=list[PurchaseOrderRead])
def get_purchase_orders_by_status(
    status: POStatusEnum,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.get_all_pos_by_status(
        po_status=status,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/supplier/{supplier_id}", response_model=list[PurchaseOrderRead])
def get_purchase_orders_by_supplier(
    supplier_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.get_all_pos_by_supplier(
        supplier_id=supplier_id,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{po_id}", response_model=PurchaseOrderDetailRead)
def get_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.get_po(
        po_id=po_id,
        company_id=current_user.company_id,
    )

# Router to download PO PDF 
@router.get("/{po_id}/pdf")
def download_purchase_order_pdf(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: POPDFService = Depends(get_po_pdf_service),
):
    pdf_bytes, filename = service.generate_po_pdf(
        po_id=po_id,
        company_id=current_user.company_id,
    )

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
        },
    )

@router.put("/{po_id}", response_model=PurchaseOrderRead)
def update_purchase_order(
    po_id: UUID,
    po_data: PurchaseOrderUpdate,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.update_po(
        po_id=po_id,
        po_data=po_data,
        company_id=current_user.company_id,
        user_id=current_user.id,
    )


# PURCHASE ORDER ITEMS ROUTES
@router.post(
    "/{po_id}/items",
    response_model=PurchaseOrderItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_purchase_order_item(
    po_id: UUID,
    item_data: PurchaseOrderItemCreate,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.create_po_item(
        po_id=po_id,
        item_data=item_data,
        company_id=current_user.company_id,
    )



@router.get(
    "/{po_id}/items",
    response_model=list[PurchaseOrderItemRead],
)
def get_all_purchase_order_items(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.get_all_po_items(
        po_id=po_id,
        company_id=current_user.company_id,
    )


@router.put(
    "/{po_id}/items/{item_id}",
    response_model=PurchaseOrderItemRead,
)
def update_purchase_order_item(
    po_id: UUID,
    item_id: UUID,
    item_data: PurchaseOrderItemUpdate,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.update_po_item(
        po_id=po_id,
        item_id=item_id,
        item_data=item_data,
        company_id=current_user.company_id,
    )


@router.delete(
    "/{po_id}/items/{item_id}",
    response_model=PurchaseOrderItemRead,
)
def delete_purchase_order_item(
    po_id: UUID,
    item_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.delete_po_item(
        po_id=po_id,
        item_id=item_id,
        company_id=current_user.company_id,
    )

# GENERAL PO ROUTER HANDLING

@router.patch("/{po_id}/submit", response_model=PurchaseOrderRead)
def submit_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.submit_po(
        po_id=po_id,
        company_id=current_user.company_id,
        submitted_by=current_user.id,
        role_id=current_user.role_id,
    )


@router.patch("/{po_id}/approve", response_model=PurchaseOrderRead)
def approve_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.approve_po(
        po_id=po_id,
        company_id=current_user.company_id,
    )


@router.patch("/{po_id}/reject", response_model=PurchaseOrderRead)
def reject_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.reject_po(
        po_id=po_id,
        company_id=current_user.company_id,
    )


@router.patch("/{po_id}/send", response_model=PurchaseOrderRead)
def send_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PODispatchService = Depends(get_po_dispatch_service),
):
    return service.send_po_to_supplier(
        po_id=po_id,
        company_id=current_user.company_id,
        issued_by=current_user.id,
    )

@router.patch("/{po_id}/resend", response_model=PurchaseOrderRead)
def resend_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PODispatchService = Depends(get_po_dispatch_service),
):
    return service.resend_po_to_supplier(
        po_id=po_id,
        company_id=current_user.company_id,
        resent_by=current_user.id,
    )


@router.patch("/{po_id}/partial-receive", response_model=PurchaseOrderRead)
def mark_purchase_order_partially_received(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.mark_po_partially_received(
        po_id=po_id,
        company_id=current_user.company_id,
    )


@router.patch("/{po_id}/receive", response_model=PurchaseOrderRead)
def receive_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.receive_po(
        po_id=po_id,
        company_id=current_user.company_id,
    )


@router.patch("/{po_id}/cancel", response_model=PurchaseOrderRead)
def cancel_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.cancel_po(
        po_id=po_id,
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
    )


@router.delete("/{po_id}", response_model=PurchaseOrderRead)
def delete_purchase_order(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return service.delete_po(
        po_id=po_id,
        company_id=current_user.company_id,
    )


# EMAIL LOG ENDPOINTS
@router.get(
    "/{po_id}/email-logs",
    response_model=list[POEmailLogRead],
)
def get_purchase_order_email_logs(
    po_id: UUID,
    current_user=Depends(get_current_user),
    service: POEmailLogService = Depends(get_po_email_log_service),
):
    return service.get_all_logs_for_po(
        po_id=po_id,
        company_id=current_user.company_id,
    )