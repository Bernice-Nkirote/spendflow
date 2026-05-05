from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status

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
from app.repositories.reports.report_repository import ReportRepository
from app.repositories.report_export_log_repository import ReportExportLogRepository
from app.schemas.reports.payment_report_schema import (
    PaymentReportFilter,
    PaymentReportResponse,
)
from app.schemas.reports.invoice_report_schema import(
    InvoiceReportFilter,
    InvoiceReportResponse,
)
from app.schemas.reports.outstanding_invoice_report_schema import (
    OutstandingInvoiceReportFilter,
    OutstandingInvoiceReportResponse,
)
from app.schemas.reports.supplier_spend_report_schema import (
    SupplierSpendReportFilter,
    SupplierSpendReportResponse,
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
)
from app.services.permission_service import PermissionService
from app.utils.reports.csv_generator import generate_csv_report
from app.utils.reports.excel_generator import generate_excel_report


class ReportService:
    def __init__(
        self,
        report_repo: ReportRepository,
        permission_service: PermissionService,
        report_export_log_repo: ReportExportLogRepository,
        payment_report_builder: PaymentReportBuilder,
        invoice_report_builder: InvoiceReportBuilder,
        outstanding_invoice_report_builder: OutstandingInvoiceReportBuilder,
        supplier_spend_report_builder: SupplierSpendReportBuilder,
        pr_report_builder: PRReportBuilder,
        po_report_builder: POReportBuilder,
        supplier_lead_time_report_builder: SupplierLeadTimeReportBuilder,
    ):
        self.report_repo = report_repo
        self.permission_service = permission_service
        self.report_export_log_repo = report_export_log_repo
        self.payment_report_builder = payment_report_builder
        self.invoice_report_builder = invoice_report_builder
        self.outstanding_invoice_report_builder = outstanding_invoice_report_builder
        self.supplier_spend_report_builder = supplier_spend_report_builder
        self.pr_report_builder = pr_report_builder
        self.po_report_builder = po_report_builder
        self.supplier_lead_time_report_builder = supplier_lead_time_report_builder
    # -------------------
    # PAYMENT SERVICE
    # -------------------

    def get_payment_report(
        self,
        company_id: UUID,
        role_id: UUID,
        filters: PaymentReportFilter,
    ) -> PaymentReportResponse:
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.payments.view",
        )

        raw_rows = self.report_repo.get_payment_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.payment_report_builder.build_rows(raw_rows)

        total_count = self.report_repo.count_payment_report_rows(
            company_id=company_id,
            filters=filters,
        )

        return PaymentReportResponse(
            rows=rows,
            total_count=total_count,
        )

    def export_payment_report_csv(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: PaymentReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.payments.export",
        )

        raw_rows = self.report_repo.get_payment_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.payment_report_builder.build_rows(raw_rows)

        csv_file = generate_csv_report(
            headers=self.payment_report_builder.headers(),
            rows=self.payment_report_builder.export_rows(rows),
        )

        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="payments",
            export_format="CSV",
        )

        return csv_file, self._build_filename("payments_report", "csv")

    def export_payment_report_excel(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: PaymentReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.payments.export",
        )

        raw_rows = self.report_repo.get_payment_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.payment_report_builder.build_rows(raw_rows)

        excel_file = generate_excel_report(
            sheet_name="Payments Report",
            headers=self.payment_report_builder.headers(),
            rows=self.payment_report_builder.export_rows(rows),
        )

        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="payments",
            export_format="EXCEL",
        )

        return excel_file, self._build_filename("payments_report", "xlsx")

    def _require_permission(
        self,
        role_id: UUID,
        company_id: UUID,
        permission_name: str,
    ) -> None:
        has_permission = self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name=permission_name,
            company_id=company_id,
        )

        if not has_permission:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this report",
            )

    def _build_filename(
        self,
        report_name: str,
        extension: str,
    ) -> str:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S_%f")
        return f"{report_name}_{timestamp}.{extension}"
    
    # -------------------
    # INVOICE SERVICE 
    # -------------------

    def get_invoice_report(
        self,
        company_id: UUID,
        role_id: UUID,
        filters: InvoiceReportFilter,
    ) -> InvoiceReportResponse:
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.invoices.view",
        )

        raw_rows = self.report_repo.get_invoice_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.invoice_report_builder.build_rows(raw_rows)

        total_count = self.report_repo.count_invoice_report_rows(
            company_id=company_id,
            filters=filters,
        )

        return InvoiceReportResponse(
            rows=rows,
            total_count=total_count,
        )


    def export_invoice_report_csv(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: InvoiceReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.invoices.export",
        )

        raw_rows = self.report_repo.get_invoice_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.invoice_report_builder.build_rows(raw_rows)

        csv_file = generate_csv_report(
            headers=self.invoice_report_builder.headers(),
            rows=self.invoice_report_builder.export_rows(rows),
        )

        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="invoices",
            export_format="CSV",
        )

        return csv_file, self._build_filename("invoices_report", "csv")


    def export_invoice_report_excel(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: InvoiceReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.invoices.export",
        )

        raw_rows = self.report_repo.get_invoice_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.invoice_report_builder.build_rows(raw_rows)

        excel_file = generate_excel_report(
            sheet_name="Invoices Report",
            headers=self.invoice_report_builder.headers(),
            rows=self.invoice_report_builder.export_rows(rows),
        )

        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="invoices",
            export_format="EXCEL",
        )

        return excel_file, self._build_filename("invoices_report", "xlsx")
    
    # ---------------------------
    # OUTSTANDING INVOICE SERVICE 
    # ---------------------------

    def get_outstanding_invoice_report(
        self,
        company_id: UUID,
        role_id: UUID,
        filters: OutstandingInvoiceReportFilter,
    ) -> OutstandingInvoiceReportResponse:
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.outstanding_invoices.view",
        )

        raw_rows = self.report_repo.get_outstanding_invoice_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.outstanding_invoice_report_builder.build_rows(raw_rows)

        total_count = self.report_repo.count_outstanding_invoice_report_rows(
            company_id=company_id,
            filters=filters,
        )

        return OutstandingInvoiceReportResponse(
            rows=rows,
            total_count=total_count,
        )


    def export_outstanding_invoice_report_csv(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: OutstandingInvoiceReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.outstanding_invoices.export",
        )

        raw_rows = self.report_repo.get_outstanding_invoice_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.outstanding_invoice_report_builder.build_rows(raw_rows)

        csv_file = generate_csv_report(
            headers=self.outstanding_invoice_report_builder.headers(),
            rows=self.outstanding_invoice_report_builder.export_rows(rows),
        )

        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="outstanding_invoices",
            export_format="CSV",
        )

        return csv_file, self._build_filename("outstanding_invoices_report", "csv")


    def export_outstanding_invoice_report_excel(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: OutstandingInvoiceReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.outstanding_invoices.export",
        )

        raw_rows = self.report_repo.get_outstanding_invoice_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.outstanding_invoice_report_builder.build_rows(raw_rows)

        excel_file = generate_excel_report(
            sheet_name="Outstanding Invoices",
            headers=self.outstanding_invoice_report_builder.headers(),
            rows=self.outstanding_invoice_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="outstanding_invoices",
            export_format="EXCEL",
        )

        return excel_file, self._build_filename("outstanding_invoices_report", "xlsx")

    # ---------------------------
    # SUPPLIER SPEND SERVICE 
    # ---------------------------

    def get_supplier_spend_report(
        self,
        company_id: UUID,
        role_id: UUID,
        filters: SupplierSpendReportFilter,
    ) -> SupplierSpendReportResponse:
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.supplier_spend.view",
        )

        raw_rows = self.report_repo.get_supplier_spend_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.supplier_spend_report_builder.build_rows(raw_rows)

        total_count = self.report_repo.count_supplier_spend_report_rows(
            company_id=company_id,
            filters=filters,
        )

        return SupplierSpendReportResponse(
            rows=rows,
            total_count=total_count,
        )


    def export_supplier_spend_report_csv(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: SupplierSpendReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.supplier_spend.export",
        )

        raw_rows = self.report_repo.get_supplier_spend_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.supplier_spend_report_builder.build_rows(raw_rows)

        csv_file = generate_csv_report(
            headers=self.supplier_spend_report_builder.headers(),
            rows=self.supplier_spend_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="supplier_spend",
            export_format="CSV",
        )

        return csv_file, self._build_filename("supplier_spend_report", "csv")


    def export_supplier_spend_report_excel(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: SupplierSpendReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.supplier_spend.export",
        )

        raw_rows = self.report_repo.get_supplier_spend_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.supplier_spend_report_builder.build_rows(raw_rows)

        excel_file = generate_excel_report(
            sheet_name="Supplier Spend",
            headers=self.supplier_spend_report_builder.headers(),
            rows=self.supplier_spend_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="supplier_spend",
            export_format="EXCEL",
        )
        return excel_file, self._build_filename("supplier_spend_report", "xlsx")

    # ---------------------
    # PR REPORT SERVICE 
    # ----------------------

    def get_pr_report(
        self,
        company_id: UUID,
        role_id: UUID,
        filters: PRReportFilter,
    ) -> PRReportResponse:
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.pr.view",
        )

        raw_rows = self.report_repo.get_pr_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.pr_report_builder.build_rows(raw_rows)

        total_count = self.report_repo.count_pr_report_rows(
            company_id=company_id,
            filters=filters,
        )

        return PRReportResponse(
            rows=rows,
            total_count=total_count,
        )

    def export_pr_report_csv(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: PRReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.pr.export",
        )

        raw_rows = self.report_repo.get_pr_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.pr_report_builder.build_rows(raw_rows)

        csv_file = generate_csv_report(
            headers=self.pr_report_builder.headers(),
            rows=self.pr_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="purchase_requisitions",
            export_format="CSV",
        )

        return csv_file, self._build_filename("purchase_requisitions_report", "csv")

    def export_pr_report_excel(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: PRReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.pr.export",
        )

        raw_rows = self.report_repo.get_pr_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.pr_report_builder.build_rows(raw_rows)

        excel_file = generate_excel_report(
            sheet_name="PR Report",
            headers=self.pr_report_builder.headers(),
            rows=self.pr_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="purchase_requisitions",
            export_format="EXCEL",
        )

        return excel_file, self._build_filename("purchase_requisitions_report", "xlsx")
    
    # ---------------------
    # PO REPORT SERVICE 
    # ----------------------

    def get_po_report(
        self,
        company_id: UUID,
        role_id: UUID,
        filters: POReportFilter,
    ) -> POReportResponse:
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.po.view",
        )

        raw_rows = self.report_repo.get_po_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.po_report_builder.build_rows(raw_rows)

        total_count = self.report_repo.count_po_report_rows(
            company_id=company_id,
            filters=filters,
        )

        return POReportResponse(
            rows=rows,
            total_count=total_count,
        )


    def export_po_report_csv(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: POReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.po.export",
        )

        raw_rows = self.report_repo.get_po_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.po_report_builder.build_rows(raw_rows)

        csv_file = generate_csv_report(
            headers=self.po_report_builder.headers(),
            rows=self.po_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="purchase_orders",
            export_format="CSV",
        )

        return csv_file, self._build_filename("purchase_orders_report", "csv")


    def export_po_report_excel(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: POReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.po.export",
        )

        raw_rows = self.report_repo.get_po_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.po_report_builder.build_rows(raw_rows)

        excel_file = generate_excel_report(
            sheet_name="PO Report",
            headers=self.po_report_builder.headers(),
            rows=self.po_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="purchase_orders",
            export_format="EXCEL",
        )

        return excel_file, self._build_filename("purchase_orders_report", "xlsx")

    # ---------------------------------
    # SUPPLIER LEAD TIME REPORT SERVICE 
    # ---------------------------------
    
    def get_supplier_lead_time_report(
        self,
        company_id: UUID,
        role_id: UUID,
        filters: SupplierLeadTimeReportFilter,
    ) -> SupplierLeadTimeReportResponse:
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.supplier_lead_time.view",
        )

        raw_rows = self.report_repo.get_supplier_lead_time_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.supplier_lead_time_report_builder.build_rows(raw_rows)

        total_count = self.report_repo.count_supplier_lead_time_report_rows(
            company_id=company_id,
            filters=filters,
        )
    
        return SupplierLeadTimeReportResponse(
            rows=rows,
            total_count=total_count,
        )


    def export_supplier_lead_time_report_csv(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: SupplierLeadTimeReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.supplier_lead_time.export",
        )

        raw_rows = self.report_repo.get_supplier_lead_time_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.supplier_lead_time_report_builder.build_rows(raw_rows)

        csv_file = generate_csv_report(
            headers=self.supplier_lead_time_report_builder.headers(),
            rows=self.supplier_lead_time_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="supplier_lead_time",
            export_format="CSV",
        )
        return csv_file, self._build_filename("supplier_lead_time_report", "csv")


    def export_supplier_lead_time_report_excel(
        self,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
        filters: SupplierLeadTimeReportFilter,
    ):
        self._require_permission(
            role_id=role_id,
            company_id=company_id,
            permission_name="reports.supplier_lead_time.export",
        )

        raw_rows = self.report_repo.get_supplier_lead_time_report_rows(
            company_id=company_id,
            filters=filters,
        )

        rows = self.supplier_lead_time_report_builder.build_rows(raw_rows)

        excel_file = generate_excel_report(
            sheet_name="Supplier Lead Time",
            headers=self.supplier_lead_time_report_builder.headers(),
            rows=self.supplier_lead_time_report_builder.export_rows(rows),
        )
        self._log_report_export(
            company_id=company_id,
            user_id=user_id,
            report_type="supplier_lead_time",
            export_format="EXCEL",
        )

        return excel_file, self._build_filename("supplier_lead_time_report", "xlsx")

    # -------------------------
    # REPORTS LOG
    # -------------------------
    def _log_report_export(
        self,
        company_id: UUID,
        user_id: UUID,
        report_type: str,
        export_format: str,
    ) -> None:
        self.report_export_log_repo.create(
            company_id=company_id,
            user_id=user_id,
            report_type=report_type,
            export_format=export_format,
        )

        self.report_repo.db.commit()