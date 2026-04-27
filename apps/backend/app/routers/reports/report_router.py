from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.builders.reports.payment_report_builder import PaymentReportBuilder
from app.core.database import get_db
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.repositories.reports.report_repository import ReportRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.reports.payment_report_schema import (
    PaymentReportFilter,
    PaymentReportResponse,
)
from app.services.audit_log_service import AuditLogService
from app.services.permission_service import PermissionService
from app.services.reports.report_service import ReportService


router = APIRouter(
    prefix="/reports",
    tags=["Reports"],
)


def get_report_service(db: Session = Depends(get_db)) -> ReportService:
    permission_repo = PermissionRepository(db)
    role_permission_repo = RolePermissionRepository(db)
    role_repo = RoleRepository(db)

    audit_log_service = AuditLogService(db)

    permission_service = PermissionService(
        permission_repo=permission_repo,
        role_permission_repo=role_permission_repo,
        role_repo=role_repo,
        audit_log_service=audit_log_service,
    )

    return ReportService(
        report_repo=ReportRepository(db),
        permission_service=permission_service,
        payment_report_builder=PaymentReportBuilder(),
    )


# PAYMENT REPORTS ROUTER
@router.get(
    "/payments",
    response_model=PaymentReportResponse,
)
def get_payment_report(
    filters: PaymentReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_payment_report(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )


@router.get("/payments/export/csv")
def export_payment_report_csv(
    filters: PaymentReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    csv_file, filename = report_service.export_payment_report_csv(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )


@router.get("/payments/export/excel")
def export_payment_report_excel(
    filters: PaymentReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    excel_file, filename = report_service.export_payment_report_excel(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
        },
    )

# INVOICE REPORT ROUTER
