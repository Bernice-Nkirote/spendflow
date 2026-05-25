from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.dashboard_repository import DashboardRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.schemas.dashboard_schema import DashboardResponse
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.dashboard_service import DashboardService


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    dashboard_repo = DashboardRepository(db)

    approval_instance_service = ApprovalInstanceService(
        repo=ApprovalInstanceRepository(db),
        workflow_level_repo=WorkflowLevelRepository(db),
        pr_repo=PurchaseRequisitionRepository(db),
        po_repo=PurchaseOrderRepository(db),
        invoice_repo=InvoiceRepository(db),
        payment_repo=PaymentRepository(db),
    )

    dashboard_service = DashboardService(
        dashboard_repo=dashboard_repo,
        approval_instance_service=approval_instance_service,
    )

    return dashboard_service.get_dashboard(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        department_id=current_user.department_id,
    )