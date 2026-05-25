from uuid import UUID

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard_schema import (
    ApprovalQueueItem,
    DashboardResponse,
    DashboardSummary,
    ProcurementWorkflowSummary,
    RecentActivityItem,
    ReportingSnapshot,
)
from app.utils.value_helper.enum_utils import enum_value


class DashboardService:
    def __init__(
        self,
        dashboard_repo: DashboardRepository,
        approval_instance_service,
    ):
        self.dashboard_repo = dashboard_repo
        self.approval_instance_service = approval_instance_service

    def _build_approval_queue(
        self,
        company_id: UUID,
        role_id: UUID,
        department_id: UUID | None,
    ) -> list[ApprovalQueueItem]:
        queue = self.approval_instance_service.get_my_pending_queue(
            company_id=company_id,
            role_id=role_id,
            department_id=department_id,
            skip=0,
            limit=5,
        )

        return [
            ApprovalQueueItem(
                id=str(instance.id),
                document_type=enum_value(instance.entity_type),
                document_reference=instance.entity_reference or "N/A",
                status=enum_value(instance.status),
                requested_by=instance.requester_name or "N/A",
                created_at=instance.created_at,
            )
            for instance in queue["rows"]
        ]

    def get_dashboard(
        self,
        company_id: UUID,
        role_id: UUID,
        department_id: UUID | None,
    ) -> DashboardResponse:
        total_prs = self.dashboard_repo.count_purchase_requisitions(company_id)
        total_pos = self.dashboard_repo.count_purchase_orders(company_id)
        total_invoices = self.dashboard_repo.count_invoices(company_id)
        total_payments = self.dashboard_repo.count_payments(company_id)

        pending_approvals = (
            self.approval_instance_service.repo.count_my_pending_queue(
                company_id=company_id,
                role_id=role_id,
                department_id=department_id,
            )
        )

        recent_logs = self.dashboard_repo.get_recent_audit_logs(
            company_id=company_id,
            limit=5,
        )

        recent_activity = [
            RecentActivityItem(
                id=str(log.id),
                action=log.action,
                entity_type=log.entity_type,
                entity_reference=getattr(log, "entity_reference", None),
                performed_by=getattr(log, "performed_by", None),
                created_at=log.created_at,
            )
            for log in recent_logs
        ]

        return DashboardResponse(
            currency=self.dashboard_repo.get_company_currency(company_id),
            summary=DashboardSummary(
                total_purchase_requisitions=total_prs,
                total_purchase_orders=total_pos,
                pending_approvals=pending_approvals,
                total_spend=self.dashboard_repo.get_total_approved_spend(company_id),
            ),
            workflow=ProcurementWorkflowSummary(
                purchase_requisitions=total_prs,
                purchase_orders=total_pos,
                invoices=total_invoices,
                payments=total_payments,
            ),
            approval_queue=self._build_approval_queue(
                company_id=company_id,
                role_id=role_id,
                department_id=department_id,
            ),
            recent_activity=recent_activity,
            reporting_snapshot=ReportingSnapshot(
                total_reports_generated=self.dashboard_repo.count_reports_generated(
                    company_id
                ),
                last_report_generated_at=self.dashboard_repo.get_last_report_generated_at(
                    company_id
                ),
                export_formats_available=["CSV", "EXCEL"],
            ),
        )