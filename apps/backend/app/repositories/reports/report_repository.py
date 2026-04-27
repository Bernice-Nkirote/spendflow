from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.invoice import Invoice
from app.models.payments import Payment
from app.models.supplier import Supplier
from app.schemas.reports.payment_report_schema import PaymentReportFilter


class ReportRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_payment_report_rows(
        self,
        company_id: UUID,
        filters: PaymentReportFilter,
    ):
        query = (
            self.db.query(
                Payment.id.label("payment_id"),
                Payment.invoice_id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),
                Invoice.supplier_id.label("supplier_id"),
                Supplier.name.label("supplier_name"),
                Payment.amount.label("amount"),
                Payment.status.label("status"),
                Payment.payment_method.label("payment_method"),
                Payment.reference.label("reference"),
                Payment.created_by.label("created_by"),
                Payment.created_at.label("created_at"),
                Payment.paid_at.label("paid_at"),
            )
            .join(Invoice, Payment.invoice_id == Invoice.id)
            .join(Supplier, Invoice.supplier_id == Supplier.id)
            .filter(
                Payment.company_id == company_id,
                Invoice.company_id == company_id,
                Supplier.company_id == company_id,
            )
        )

        query = self._apply_payment_filters(query, filters)

        return (
            query.order_by(Payment.created_at.desc())
            .offset(filters.skip)
            .limit(filters.limit)
            .all()
        )

    def count_payment_report_rows(
        self,
        company_id: UUID,
        filters: PaymentReportFilter,
    ) -> int:
        query = (
            self.db.query(func.count(Payment.id))
            .join(Invoice, Payment.invoice_id == Invoice.id)
            .join(Supplier, Invoice.supplier_id == Supplier.id)
            .filter(
                Payment.company_id == company_id,
                Invoice.company_id == company_id,
                Supplier.company_id == company_id,
            )
        )

        query = self._apply_payment_filters(query, filters)

        return query.scalar() or 0

    def _apply_payment_filters(
        self,
        query,
        filters: PaymentReportFilter,
    ):
        if filters.status:
            query = query.filter(Payment.status == filters.status)

        if filters.payment_method:
            query = query.filter(Payment.payment_method == filters.payment_method)

        if filters.invoice_id:
            query = query.filter(Payment.invoice_id == filters.invoice_id)

        if filters.supplier_id:
            query = query.filter(Invoice.supplier_id == filters.supplier_id)

        if filters.date_from:
            query = query.filter(Payment.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Payment.created_at <= filters.date_to)

        if filters.min_amount is not None:
            query = query.filter(Payment.amount >= filters.min_amount)

        if filters.max_amount is not None:
            query = query.filter(Payment.amount <= filters.max_amount)

        return query