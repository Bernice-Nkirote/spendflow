from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.models.enums import InvoiceStatusEnum, POStatusEnum
from app.models.permission import Permission
from app.models.role_permission import RolePermission
from app.models.user import User
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.schemas.task_schema import MyTasksResponse, TaskRead

router = APIRouter(prefix="/tasks", tags=["Tasks"])


def role_has_permission(
    db: Session,
    role_id,
    company_id,
    permission_name: str,
) -> bool:
    permission = (
        db.query(Permission)
        .filter(
            Permission.company_id == company_id,
            Permission.name == permission_name,
            Permission.is_active.is_(True),
        )
        .first()
    )

    if not permission:
        return False

    role_permission = (
        db.query(RolePermission)
        .filter(
            RolePermission.company_id == company_id,
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission.id,
        )
        .first()
    )

    return role_permission is not None


@router.get("/my-actions", response_model=MyTasksResponse)
def get_my_action_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tasks: list[TaskRead] = []

    pr_repo = PurchaseRequisitionRepository(db)
    po_repo = PurchaseOrderRepository(db)
    invoice_repo = InvoiceRepository(db)
    payment_repo = PaymentRepository(db)

    company_id = current_user.company_id
    role_id = current_user.role_id

    if role_has_permission(db, role_id, company_id, "po.create"):
        ready_requisitions = pr_repo.get_ready_for_po(company_id=company_id)

        for requisition in ready_requisitions:
            tasks.append(
                TaskRead(
                    id=f"CREATE_PO:{requisition.id}",
                    type="CREATE_PO",
                    reference=requisition.pr_number,
                    message="Approved PR ready for PO creation.",
                    url=f"/purchase-requisitions/{requisition.id}",
                    created_at=requisition.created_at,
                )
            )

    if role_has_permission(db, role_id, company_id, "po.dispatch"):
        approved_pos = po_repo.get_by_status(
            status=POStatusEnum.APPROVED,
            company_id=company_id,
            skip=0,
            limit=20,
        )

        for po in approved_pos:
            tasks.append(
                TaskRead(
                    id=f"DISPATCH_PO:{po.id}",
                    type="DISPATCH_PO",
                    reference=po.po_number,
                    message="Approved PO ready to be sent to supplier.",
                    url=f"/purchase-orders/{po.id}",
                    created_at=po.created_at,
                )
            )

    if role_has_permission(db, role_id, company_id, "invoice.create"):
        ready_pos = po_repo.get_ready_for_invoicing(company_id=company_id)

        for po in ready_pos:
            if po.status != POStatusEnum.SENT:
                continue

            tasks.append(
                TaskRead(
                    id=f"CREATE_INVOICE:{po.id}",
                    type="CREATE_INVOICE",
                    reference=po.po_number,
                    message="Sent PO ready for invoice creation.",
                    url=f"/invoices/new?purchaseOrderId={po.id}&from=tasks",
                    created_at=po.created_at,
                )
            )

    if role_has_permission(db, role_id, company_id, "payment.create"):
        payable_statuses = [
            InvoiceStatusEnum.APPROVED,
            InvoiceStatusEnum.PARTIALLY_PAID,
        ]

        for invoice_status in payable_statuses:
            invoices = invoice_repo.get_by_status(
                status=invoice_status,
                company_id=company_id,
                skip=0,
                limit=20,
            )

            for invoice in invoices:
                reserved_amount = payment_repo.get_total_reserved_amount(
                    invoice_id=invoice.id,
                    company_id=company_id,
                )

                if reserved_amount >= invoice.total_amount:
                    continue

                tasks.append(
                    TaskRead(
                        id=f"CREATE_PAYMENT:{invoice.id}",
                        type="CREATE_PAYMENT",
                        reference=invoice.invoice_number,
                        message="Approved invoice ready for payment creation.",
                        url=f"/invoices/{invoice.id}/payments/new?from=tasks",
                        created_at=invoice.created_at,
                    )
                )

    tasks.sort(
        key=lambda task: task.created_at or "",
        reverse=True,
    )

    return MyTasksResponse(
        rows=tasks[:20],
        total_count=len(tasks),
    )