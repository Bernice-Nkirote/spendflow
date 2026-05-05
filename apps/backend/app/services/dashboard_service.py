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
    def __init__(self, dashboard_repo: DashboardRepository):
        self.dashboard_repo = dashboard_repo

    def _build_approval_queue(self, company_id: UUID):
        pending_prs = self.dashboard_repo.get_pending_purchase_requisitions_for_approval(
            company_id=company_id,
            limit=5,
        )

        pending_pos = self.dashboard_repo.get_pending_purchase_orders_for_approval(
            company_id=company_id,
            limit=5,
        )

        pending_invoices = self.dashboard_repo.get_pending_invoices_for_approval(
            company_id=company_id,
            limit=5,
        )

        pending_payments = self.dashboard_repo.get_pending_payments_for_approval(
            company_id=company_id,
            limit=5,
        )

        approval_items = []

        for pr in pending_prs:
            approval_items.append(
                ApprovalQueueItem(
                    id=str(pr.id),
                    document_type="PR",
                    document_reference=pr.pr_number,
                    status=enum_value(pr.status),
                    requested_by=(
                        getattr(getattr(pr, "requester", None), "name", None) 
                        or "N/A"
                    ),
                    created_at=pr.created_at,
                )
            )

        for po in pending_pos:
            approval_items.append(
                ApprovalQueueItem(
                    id=str(po.id),
                    document_type="PO",
                    document_reference=po.po_number,
                    status=enum_value(po.status),
                    requested_by=(
                        getattr(getattr(po, "creator", None), "name", None)
                        or "N/A"
                    ),
                    created_at=po.created_at,
                )
            )

        for invoice in pending_invoices:
            approval_items.append(
                ApprovalQueueItem(
                    id=str(invoice.id),
                    document_type="INVOICE",
                    document_reference=invoice.invoice_number,
                    status=enum_value(invoice.status),
                    requested_by=(
                        getattr(getattr(invoice, "submitted_by_user", None), "name", None)
                        or getattr(getattr(invoice, "submitted_by_supplier_user", None), "email", None)
                        or "N/A"
                    ),
                    created_at=invoice.created_at,
                )
            )

        for payment in pending_payments:
            approval_items.append(
                ApprovalQueueItem(
                    id=str(payment.id),
                    document_type="PAYMENT",
                    document_reference=payment.reference or str(payment.id),
                    status=enum_value(payment.status),
                    requested_by=(
                        getattr(getattr(payment, "created_by_user", None), "name", None)
                        or "N/A"
                    ),
                    created_at=payment.created_at,
                )
            )

        approval_items.sort(
            key=lambda item: item.created_at,
            reverse=True,
        )

        return approval_items[:5]

    def get_dashboard(self, company_id: UUID) -> DashboardResponse:
        total_prs = self.dashboard_repo.count_purchase_requisitions(company_id)
        total_pos = self.dashboard_repo.count_purchase_orders(company_id)
        total_invoices = self.dashboard_repo.count_invoices(company_id)
        total_payments = self.dashboard_repo.count_payments(company_id)

        pending_prs = self.dashboard_repo.count_pending_purchase_requisitions(company_id)
        pending_pos = self.dashboard_repo.count_pending_purchase_orders(company_id)
        pending_invoices = self.dashboard_repo.count_pending_invoices(company_id)
        pending_payments = self.dashboard_repo.count_pending_payments(company_id)

        pending_approvals = (
            pending_prs
            + pending_pos
            + pending_invoices
            + pending_payments
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
            approval_queue=self._build_approval_queue(company_id),
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