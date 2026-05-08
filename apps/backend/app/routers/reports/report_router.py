from uuid import UUID
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.builders.reports.payment_report_builder import PaymentReportBuilder
from app.builders.reports.invoice_report_builder import InvoiceReportBuilder
from app.builders.reports.outstanding_invoice_report_builder import (
    OutstandingInvoiceReportBuilder,
)
from app.builders.reports.supplier_spend_report_builder import (
    SupplierSpendReportBuilder,
)
from app.builders.reports.pr_report_builder import PRReportBuilder
from app.builders.reports.po_report_builder import POReportBuilder
from app.builders.reports.supplier_lead_time_report_builder import (
    SupplierLeadTimeReportBuilder,
)
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
from app.repositories.report_export_log_repository import ReportExportLogRepository
from app.schemas.reports.invoice_report_schema import (
    InvoiceReportFilter,
    InvoiceReportResponse,
)
from app.schemas.reports.outstanding_invoice_report_schema import (
    OutstandingInvoiceReportFilter,
    OutstandingInvoiceReportResponse,
    OutstandingInvoiceReportRow,
)
from app.schemas.reports.supplier_spend_report_schema import (
    SupplierSpendReportFilter,
    SupplierSpendReportResponse,
    SupplierSpendDetailResponse,
)
from app.schemas.reports.pr_report_schema import (
    PRReportFilter,
    PRReportResponse,
)
from app.schemas.reports.po_report_schema import (
    POReportFilter,
    POReportResponse,
)
from app.schemas.reports.supplier_lead_time_report_schema import (
    SupplierLeadTimeReportFilter,
    SupplierLeadTimeReportResponse,
    SupplierLeadTimeDetailResponse,
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
        report_export_log_repo=ReportExportLogRepository(db),
        payment_report_builder=PaymentReportBuilder(),
        invoice_report_builder=InvoiceReportBuilder(),
        outstanding_invoice_report_builder=OutstandingInvoiceReportBuilder(),
        supplier_spend_report_builder=SupplierSpendReportBuilder(),
        pr_report_builder=PRReportBuilder(),
        po_report_builder=POReportBuilder(),
        supplier_lead_time_report_builder=SupplierLeadTimeReportBuilder(),
    )

# ----------------------
# PAYMENT REPORTS ROUTER
# ----------------------
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
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
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
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )

# ---------------------
# INVOICE REPORT ROUTER
# ---------------------
@router.get(
    "/invoices",
    response_model=InvoiceReportResponse,
)
def get_invoice_report(
    filters: InvoiceReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_invoice_report(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )


@router.get("/invoices/export/csv")
def export_invoice_report_csv(
    filters: InvoiceReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    csv_file, filename = report_service.export_invoice_report_csv(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )


@router.get("/invoices/export/excel")
def export_invoice_report_excel(
    filters: InvoiceReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    excel_file, filename = report_service.export_invoice_report_excel(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )

# ----------------------
# OUTSTANDING INVOICE REPORTS ROUTER
# ----------------------

@router.get(
    "/outstanding-invoices",
    response_model=OutstandingInvoiceReportResponse,
)
def get_outstanding_invoice_report(
    filters: OutstandingInvoiceReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_outstanding_invoice_report(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )

@router.get(
    "/outstanding-invoices/{invoice_id}",
    response_model=OutstandingInvoiceReportRow,
)
def get_outstanding_invoice_detail(
    invoice_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_outstanding_invoice_detail(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        invoice_id=invoice_id,
    )

@router.get("/outstanding-invoices/export/csv")
def export_outstanding_invoice_report_csv(
    filters: OutstandingInvoiceReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    csv_file, filename = report_service.export_outstanding_invoice_report_csv(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )


@router.get("/outstanding-invoices/export/excel")
def export_outstanding_invoice_report_excel(
    filters: OutstandingInvoiceReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    excel_file, filename = report_service.export_outstanding_invoice_report_excel(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
       headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )

# -----------------------------
# SUPPLIER SPEND REPORTS ROUTER
# -----------------------------
@router.get(
    "/supplier-spend",
    response_model=SupplierSpendReportResponse,
)
def get_supplier_spend_report(
    filters: SupplierSpendReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_supplier_spend_report(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )

@router.get(
    "/supplier-spend/{supplier_id}",
    response_model=SupplierSpendDetailResponse,
)
def get_supplier_spend_detail(
    supplier_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_supplier_spend_detail(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        supplier_id=supplier_id,
    )

@router.get("/supplier-spend/export/csv")
def export_supplier_spend_report_csv(
    filters: SupplierSpendReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    csv_file, filename = report_service.export_supplier_spend_report_csv(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )


@router.get("/supplier-spend/export/excel")
def export_supplier_spend_report_excel(
    filters: SupplierSpendReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    excel_file, filename = report_service.export_supplier_spend_report_excel(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )

# --------------------
# PR REPORTS ROUTER
# --------------------

@router.get(
    "/purchase-requisitions",
    response_model=PRReportResponse,
)
def get_pr_report(
    filters: PRReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_pr_report(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )


@router.get("/purchase-requisitions/export/csv")
def export_pr_report_csv(
    filters: PRReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    csv_file, filename = report_service.export_pr_report_csv(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )


@router.get("/purchase-requisitions/export/excel")
def export_pr_report_excel(
    filters: PRReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    excel_file, filename = report_service.export_pr_report_excel(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )

# --------------------
# PO REPORTS ROUTER
# --------------------
@router.get(
    "/purchase-orders",
    response_model=POReportResponse,
)
def get_po_report(
    filters: POReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_po_report(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )


@router.get("/purchase-orders/export/csv")
def export_po_report_csv(
    filters: POReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    csv_file, filename = report_service.export_po_report_csv(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )


@router.get("/purchase-orders/export/excel")
def export_po_report_excel(
    filters: POReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    excel_file, filename = report_service.export_po_report_excel(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )

# --------------------------------
# SUPPLIER LEAD TIME REPORT ROUTER
# --------------------------------
@router.get(
    "/supplier-lead-time",
    response_model=SupplierLeadTimeReportResponse,
)
def get_supplier_lead_time_report(
    filters: SupplierLeadTimeReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_supplier_lead_time_report(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        filters=filters,
    )

@router.get(
    "/supplier-lead-time/{po_id}",
    response_model=SupplierLeadTimeDetailResponse,
)
def get_supplier_lead_time_detail(
    po_id: UUID,
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    return report_service.get_supplier_lead_time_detail(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        po_id=po_id,
    )

@router.get("/supplier-lead-time/export/csv")
def export_supplier_lead_time_report_csv(
    filters: SupplierLeadTimeReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    csv_file, filename = report_service.export_supplier_lead_time_report_csv(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        csv_file,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )


@router.get("/supplier-lead-time/export/excel")
def export_supplier_lead_time_report_excel(
    filters: SupplierLeadTimeReportFilter = Depends(),
    current_user: User = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service),
):
    excel_file, filename = report_service.export_supplier_lead_time_report_excel(
        company_id=current_user.company_id,
        role_id=current_user.role_id,
        user_id=current_user.id,
        filters=filters,
    )

    return StreamingResponse(
        excel_file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "Pragma": "no-cache",
            "Expires": "0",
        },   
    )