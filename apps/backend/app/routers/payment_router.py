from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.models.enums import PaymentStatusEnum
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.services.audit_log_service import AuditLogService

from app.schemas.payment_schema import PaymentCreate, PaymentRead, PaymentUpdate, PaymentDetailRead
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.payment_service import PaymentService
from app.services.permission_service import PermissionService

router = APIRouter(prefix="/payments", tags=["Payments"])


def get_payment_service(
    db: Session = Depends(get_db),
) -> PaymentService:
    payment_repo = PaymentRepository(db)
    invoice_repo = InvoiceRepository(db)
    workflow_repo = ApprovalWorkflowRepository(db)

    approval_instance_repo = ApprovalInstanceRepository(db)
    workflow_level_repo = WorkflowLevelRepository(db)
    approval_instance_service = ApprovalInstanceService(
        repo=approval_instance_repo,
        workflow_level_repo=workflow_level_repo,
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
    

    return PaymentService(
        payment_repo=payment_repo,
        invoice_repo=invoice_repo,
        workflow_repo=workflow_repo,
        approval_instance_service=approval_instance_service,
        permission_service=permission_service,
        audit_log_service=audit_log_service,
    )


@router.post(
    "/",
    response_model=PaymentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_payment(
    payment_data: PaymentCreate,
    current_user=Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    return service.create_payment(
        payment_data=payment_data,
        company_id=current_user.company_id,
        created_by=current_user.id,
        role_id=current_user.role_id,
    )


@router.get("/", response_model=list[PaymentRead])
def get_all_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    return service.get_all_payments(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/invoice/{invoice_id}", response_model=list[PaymentRead])
def get_payments_by_invoice(
    invoice_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    return service.get_all_payments_by_invoice(
        invoice_id=invoice_id,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/status/{status}", response_model=list[PaymentRead])
def get_payments_by_status(
    status: PaymentStatusEnum,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    return service.get_all_payments_by_status(
        payment_status=status,
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{payment_id}", response_model=PaymentDetailRead)
def get_payment(
    payment_id: UUID,
    current_user=Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    return service.get_payment(
        payment_id=payment_id,
        company_id=current_user.company_id,
    )


@router.put("/{payment_id}", response_model=PaymentRead)
def update_payment(
    payment_id: UUID,
    payment_data: PaymentUpdate,
    current_user=Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    return service.update_payment(
        payment_id=payment_id,
        payment_data=payment_data,
        company_id=current_user.company_id,
        actor_user_id=current_user.id,
    )


@router.patch("/{payment_id}/submit", response_model=PaymentRead)
def submit_payment(
    payment_id: UUID,
    current_user=Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    return service.submit_payment(
        payment_id=payment_id,
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        actor_user_id=current_user.id,
    )


@router.delete("/{payment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment(
    payment_id: UUID,
    current_user=Depends(get_current_user),
    service: PaymentService = Depends(get_payment_service),
):
    service.delete_payment(
        payment_id=payment_id,
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        actor_user_id=current_user.id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)