from uuid import UUID

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard_schema import (
    ApprovalQueueItem,
    DashboardActionCenter,
    DashboardResponse,
    DashboardSummary,
    ProcurementWorkflowSummary,
    RecentActivityItem,
    ReportingSnapshot,
    SpendSnapshot,
    SupplierScorecardItem,
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

    def _supplier_performance_label(self, score: int, total_orders: int) -> str:
        if total_orders == 0:
            return "New"
        if score >= 85:
            return "Excellent"
        if score >= 65:
            return "Good"
        return "Watch"

    def _build_supplier_scorecards(
        self,
        company_id: UUID,
    ) -> list[SupplierScorecardItem]:
        rows = self.dashboard_repo.get_supplier_scorecard_rows(company_id, limit=5)
        scorecards: list[SupplierScorecardItem] = []

        for row in rows:
            total_orders = int(row.total_orders or 0)
            received_orders = int(row.received_orders or 0)
            invoice_count = int(row.invoice_count or 0)
            paid_invoice_count = int(row.paid_invoice_count or 0)

            delivery_score = (
                round((received_orders / total_orders) * 60)
                if total_orders > 0
                else 0
            )
            payment_score = (
                round((paid_invoice_count / invoice_count) * 30)
                if invoice_count > 0
                else 0
            )
            activity_score = 10 if total_orders > 0 else 0
            performance_score = min(delivery_score + payment_score + activity_score, 100)

            scorecards.append(
                SupplierScorecardItem(
                    supplier_id=str(row.supplier_id),
                    supplier_name=row.supplier_name,
                    category=row.category,
                    sub_category=row.sub_category,
                    contact_person=row.contact_person,
                    email=row.email,
                    total_orders=total_orders,
                    received_orders=received_orders,
                    invoice_count=invoice_count,
                    paid_invoice_count=paid_invoice_count,
                    total_spend=row.total_spend or 0,
                    performance_score=performance_score,
                    performance_label=self._supplier_performance_label(
                        performance_score,
                        total_orders,
                    ),
                    last_order_date=row.last_order_date,
                )
            )

        return scorecards

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
        top_category_row = self.dashboard_repo.get_top_supplier_category(company_id)

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
            action_center=DashboardActionCenter(
                pending_pr_approvals=self.dashboard_repo.count_pending_purchase_requisitions(
                    company_id
                ),
                pending_po_approvals=self.dashboard_repo.count_pending_purchase_orders(
                    company_id
                ),
                pending_invoice_approvals=self.dashboard_repo.count_pending_invoices(
                    company_id
                ),
                pending_payment_approvals=self.dashboard_repo.count_pending_payments(
                    company_id
                ),
                approved_prs_awaiting_po=self.dashboard_repo.count_approved_prs_awaiting_po(
                    company_id
                ),
                approved_invoices_awaiting_payment=self.dashboard_repo.count_approved_invoices_awaiting_payment(
                    company_id
                ),
            ),
            workflow=ProcurementWorkflowSummary(
                purchase_requisitions=total_prs,
                purchase_orders=total_pos,
                invoices=total_invoices,
                payments=total_payments,
            ),
            spend_snapshot=SpendSnapshot(
                month_to_date_spend=self.dashboard_repo.get_month_to_date_spend(
                    company_id
                ),
                average_po_value=self.dashboard_repo.get_average_po_value(company_id),
                active_supplier_count=self.dashboard_repo.count_active_suppliers(
                    company_id
                ),
                top_category=top_category_row[0] if top_category_row else None,
            ),
            supplier_scorecards=self._build_supplier_scorecards(company_id),
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
