from uuid import UUID

from sqlalchemy import case, desc, func
from sqlalchemy.orm import Session

from app.models.purchase_requisition import PurchaseRequisition
from app.models.purchase_order import PurchaseOrder
from app.models.invoice import Invoice
from app.models.payments import Payment
from app.models.supplier import Supplier
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

    def count_approved_prs_awaiting_po(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(PurchaseRequisition.id))
            .filter(
                PurchaseRequisition.company_id == company_id,
                PurchaseRequisition.status == PRStatusEnum.APPROVED,
            )
            .scalar()
            or 0
        )

    def count_approved_invoices_awaiting_payment(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(Invoice.id))
            .filter(
                Invoice.company_id == company_id,
                Invoice.status == InvoiceStatusEnum.APPROVED,
            )
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
            self.db.query(
    func.coalesce(
        func.sum(
            func.coalesce(
                PurchaseOrder.base_amount,
                PurchaseOrder.total_amount,
            )
        ),
        0,
    )
)
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.status == POStatusEnum.APPROVED,
            )
            .scalar()
            or 0
        )

    def get_month_to_date_spend(self, company_id: UUID):
        return (
            self.db.query(
                func.coalesce(
                    func.sum(
                        func.coalesce(
                            PurchaseOrder.base_amount,
                            PurchaseOrder.total_amount,
                        )
                    ),
                    0,
                )
            )
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.status.in_(
                    [
                        POStatusEnum.APPROVED,
                        POStatusEnum.SENT,
                        POStatusEnum.PARTIALLY_RECEIVED,
                        POStatusEnum.RECEIVED,
                    ]
                ),
                func.date_trunc("month", PurchaseOrder.created_at)
                == func.date_trunc("month", func.now()),
            )
            .scalar()
            or 0
        )

    def get_average_po_value(self, company_id: UUID):
        return (
            self.db.query(
                func.coalesce(
                    func.avg(
                        func.coalesce(
                            PurchaseOrder.base_amount,
                            PurchaseOrder.total_amount,
                        )
                    ),
                    0,
                )
            )
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.status.in_(
                    [
                        POStatusEnum.APPROVED,
                        POStatusEnum.SENT,
                        POStatusEnum.PARTIALLY_RECEIVED,
                        POStatusEnum.RECEIVED,
                    ]
                ),
            )
            .scalar()
            or 0
        )

    def count_active_suppliers(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(Supplier.id))
            .filter(
                Supplier.company_id == company_id,
                Supplier.is_active.is_(True),
            )
            .scalar()
            or 0
        )

    def get_top_supplier_category(self, company_id: UUID):
        return (
            self.db.query(
                Supplier.category,
                func.count(Supplier.id).label("supplier_count"),
            )
            .filter(
                Supplier.company_id == company_id,
                Supplier.is_active.is_(True),
                Supplier.category.isnot(None),
                Supplier.category != "",
            )
            .group_by(Supplier.category)
            .order_by(desc("supplier_count"))
            .first()
        )

    def get_supplier_scorecard_rows(self, company_id: UUID, limit: int = 5):
        active_po_statuses = [
            POStatusEnum.APPROVED,
            POStatusEnum.SENT,
            POStatusEnum.PARTIALLY_RECEIVED,
            POStatusEnum.RECEIVED,
        ]

        po_stats = (
            self.db.query(
                PurchaseOrder.supplier_id.label("supplier_id"),
                func.count(PurchaseOrder.id).label("total_orders"),
                func.count(
                    case(
                        (
                            PurchaseOrder.status.in_(
                                [
                                    POStatusEnum.PARTIALLY_RECEIVED,
                                    POStatusEnum.RECEIVED,
                                ]
                            ),
                            PurchaseOrder.id,
                        )
                    )
                ).label("received_orders"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                PurchaseOrder.status.in_(active_po_statuses),
                                func.coalesce(
                                    PurchaseOrder.base_amount,
                                    PurchaseOrder.total_amount,
                                ),
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("total_spend"),
                func.max(PurchaseOrder.created_at).label("last_order_date"),
            )
            .filter(PurchaseOrder.company_id == company_id)
            .group_by(PurchaseOrder.supplier_id)
            .subquery()
        )

        invoice_stats = (
            self.db.query(
                Invoice.supplier_id.label("supplier_id"),
                func.count(Invoice.id).label("invoice_count"),
                func.count(
                    case(
                        (
                            Invoice.status.in_(
                                [
                                    InvoiceStatusEnum.PAID,
                                    InvoiceStatusEnum.PARTIALLY_PAID,
                                ]
                            ),
                            Invoice.id,
                        )
                    )
                ).label("paid_invoice_count"),
            )
            .filter(Invoice.company_id == company_id)
            .group_by(Invoice.supplier_id)
            .subquery()
        )

        return (
            self.db.query(
                Supplier.id.label("supplier_id"),
                Supplier.name.label("supplier_name"),
                Supplier.category,
                Supplier.sub_category,
                Supplier.contact_person,
                Supplier.email,
                func.coalesce(po_stats.c.total_orders, 0).label("total_orders"),
                func.coalesce(po_stats.c.received_orders, 0).label("received_orders"),
                func.coalesce(invoice_stats.c.invoice_count, 0).label("invoice_count"),
                func.coalesce(invoice_stats.c.paid_invoice_count, 0).label(
                    "paid_invoice_count"
                ),
                func.coalesce(po_stats.c.total_spend, 0).label("total_spend"),
                po_stats.c.last_order_date.label("last_order_date"),
            )
            .outerjoin(po_stats, po_stats.c.supplier_id == Supplier.id)
            .outerjoin(invoice_stats, invoice_stats.c.supplier_id == Supplier.id)
            .filter(
                Supplier.company_id == company_id,
                Supplier.is_active.is_(True),
            )
            .order_by(
                func.coalesce(po_stats.c.total_spend, 0).desc(),
                po_stats.c.last_order_date.desc(),
            )
            .limit(limit)
            .all()
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
