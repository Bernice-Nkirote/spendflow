from datetime import datetime
from uuid import UUID

from fastapi import HTTPException, status

from app.builders.reports.payment_report_builder import PaymentReportBuilder
from app.repositories.reports.report_repository import ReportRepository
from app.schemas.reports.payment_report_schema import (
    PaymentReportFilter,
    PaymentReportResponse,
)
from app.services.permission_service import PermissionService
from app.utils.reports.csv_generator import generate_csv_report
from app.utils.reports.excel_generator import generate_excel_report


class ReportService:
    def __init__(
        self,
        report_repo: ReportRepository,
        permission_service: PermissionService,
        payment_report_builder: PaymentReportBuilder,
    ):
        self.report_repo = report_repo
        self.permission_service = permission_service
        self.payment_report_builder = payment_report_builder

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

        return csv_file, self._build_filename("payments_report", "csv")

    def export_payment_report_excel(
        self,
        company_id: UUID,
        role_id: UUID,
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
        timestamp = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        return f"{report_name}_{timestamp}.{extension}"