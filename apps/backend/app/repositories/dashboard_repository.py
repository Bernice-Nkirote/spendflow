from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.purchase_requisition import PurchaseRequisition
from app.models.purchase_order import PurchaseOrder
from app.models.invoice import Invoice
from app.models.payments import Payment
from app.models.audit_logs import AuditLog
from app.models.enums import (
    PRStatusEnum,
    POStatusEnum,
    InvoiceStatusEnum,
    PaymentStatusEnum
)
from app.models.company import Company
from app.models.report_export_log import ReportExportLog


class DashboardRepository:
    def __init__(self, db: Session):
        self.db = db

    # SUMMARY COUNTS
    def count_purchase_requisitions(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(PurchaseRequisition.id))
            .filter(PurchaseRequisition.company_id == company_id)
            .scalar()
            or 0
        )

    def count_purchase_orders(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(PurchaseOrder.id))
            .filter(PurchaseOrder.company_id == company_id)
            .scalar()
            or 0
        )

    def count_invoices(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(Invoice.id))
            .filter(Invoice.company_id == company_id)
            .scalar()
            or 0
        )

    def count_payments(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(Payment.id))
            .filter(Payment.company_id == company_id)
            .scalar()
            or 0
        )

    # PENDING APPROVAL COUNTS
    def count_pending_purchase_requisitions(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(PurchaseRequisition.id))
            .filter(
                PurchaseRequisition.company_id == company_id,
                PurchaseRequisition.status == PRStatusEnum.PENDING_APPROVAL,
            )
            .scalar()
            or 0
        )

    def count_pending_purchase_orders(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(PurchaseOrder.id))
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.status == POStatusEnum.PENDING_APPROVAL,
            )
            .scalar()
            or 0
        )

    def count_pending_invoices(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(Invoice.id))
            .filter(
                Invoice.company_id == company_id,
                Invoice.status == InvoiceStatusEnum.PENDING_APPROVAL,
            )
            .scalar()
            or 0
        )

    def count_pending_payments(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(Payment.id))
            .filter(
                Payment.company_id == company_id,
                Payment.status == PaymentStatusEnum.PENDING_APPROVAL,
            )
            .scalar()
            or 0
        )

    # SPEND
    def get_total_approved_spend(self, company_id: UUID):
        return (
            self.db.query(func.coalesce(func.sum(PurchaseOrder.total_amount), 0))
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.status == POStatusEnum.APPROVED,
            )
            .scalar()
            or 0
        )
    
    # APPROVAL QUEUE ITEMS
    def get_pending_purchase_requisitions_for_approval(
        self,
        company_id: UUID,
        limit: int = 5,
    ):
        return (
            self.db.query(PurchaseRequisition)
            .filter(
                PurchaseRequisition.company_id == company_id,
                PurchaseRequisition.status == PRStatusEnum.PENDING_APPROVAL,
            )
            .order_by(PurchaseRequisition.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_pending_purchase_orders_for_approval(
        self,
        company_id: UUID,
        limit: int = 5,
    ):
        return (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.status == POStatusEnum.PENDING_APPROVAL,
            )
            .order_by(PurchaseOrder.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_pending_invoices_for_approval(
        self,
        company_id: UUID,
        limit: int = 5,
    ):
        return (
            self.db.query(Invoice)
            .filter(
                Invoice.company_id == company_id,
                Invoice.status == InvoiceStatusEnum.PENDING_APPROVAL,
            )
            .order_by(Invoice.created_at.desc())
            .limit(limit)
            .all()
        )

    def get_pending_payments_for_approval(
        self,
        company_id: UUID,
        limit: int = 5,
    ):
        return (
            self.db.query(Payment)
            .filter(
                Payment.company_id == company_id,
                Payment.status == PaymentStatusEnum.PENDING_APPROVAL,
            )
            .order_by(Payment.created_at.desc())
            .limit(limit)
            .all()
        )

    # AUDIT LOGS
    def get_recent_audit_logs(self, company_id: UUID, limit: int = 5):
        return (
            self.db.query(AuditLog)
            .filter(AuditLog.company_id == company_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
            .all()
        )

    # REPORTING SNAPSHOT
    def count_reports_generated(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(ReportExportLog.id))
            .filter(ReportExportLog.company_id == company_id)
            .scalar()
            or 0
    )

    def get_last_report_generated_at(self, company_id: UUID):
        return (
            self.db.query(func.max(ReportExportLog.created_at))
            .filter(ReportExportLog.company_id == company_id)
            .scalar()
        )
    
    # CURRENCY
    def get_company_currency(self, company_id: UUID) -> str:
        return (
            self.db.query(Company.currency)
            .filter(Company.id == company_id)
            .scalar()
            or "KES"
        )