from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, aliased

from app.models.invoice import Invoice
from app.models.invoice_line_item import InvoiceLineItem
from app.models.payments import Payment
from app.models.supplier import Supplier
from app.models.department import Department
from app.models.purchase_requisition import PurchaseRequisition
from app.models.purchase_requisition_item import PurchaseRequisitionItem
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.user import User
from app.models.enums import InvoiceStatusEnum
from app.schemas.reports.payment_report_schema import PaymentReportFilter
from app.schemas.reports.invoice_report_schema import InvoiceReportFilter
from app.schemas.reports.outstanding_invoice_report_schema import OutstandingInvoiceReportFilter
from app.schemas.reports.supplier_spend_report_schema import SupplierSpendReportFilter
from app.schemas.reports.pr_report_schema import PRReportFilter
from app.schemas.reports.po_report_schema import POReportFilter
from app.schemas.reports.supplier_lead_time_report_schema import (
    SupplierLeadTimeReportFilter,
)
class ReportRepository:
    def __init__(self, db: Session):
        self.db = db
        
    # --------------------
    # PAYMENT REPOSITORY
    # --------------------
    def get_payment_report_rows(
        self,
        company_id: UUID,
        filters: PaymentReportFilter,
    ):
        query = (
            self.db.query(
                Payment.id.label("payment_id"),
                Payment.reference.label("payment_reference"),

                Payment.invoice_id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),

                Invoice.supplier_id.label("supplier_id"),
                Supplier.name.label("supplier_name"),

                Payment.amount.label("amount"),
                Payment.currency.label("currency"),

                Payment.exchange_rate.label("exchange_rate"),
                Payment.base_currency.label("base_currency"),
                Payment.base_amount.label("base_amount"),
                Payment.exchange_rate_date.label("exchange_rate_date"),

                Payment.payment_method.label("payment_method"),
                Payment.status.label("status"),

                Payment.created_by.label("created_by_id"),
                User.name.label("created_by_name"),

                Payment.created_at.label("created_at"),
                Payment.paid_at.label("paid_at"),
            )
            .join(
                Invoice,
                (Payment.invoice_id == Invoice.id)
                & (Invoice.company_id == company_id),
            )
            .join(
                Supplier,
                (Invoice.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .outerjoin(
                User,
                (Payment.created_by == User.id)
                & (User.company_id == company_id),
            )
            .filter(Payment.company_id == company_id)
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
            self.db.query(Payment.id)
            .join(
                Invoice, 
                (Payment.invoice_id == Invoice.id)
                &(Invoice.company_id == company_id),
            )
            .join(
                Supplier, 
                (Invoice.supplier_id == Supplier.id)
                &(Supplier.company_id == company_id),
                )
            .outerjoin(
                User,
                (Payment.created_by == User.id)
                &(User.company_id == company_id),
            )
            .filter(
                Payment.company_id == company_id
            )
        )

        query = self._apply_payment_filters(query, filters)
        subquery = query.subquery()
        return self.db.query(func.count()).select_from(subquery).scalar() or 0

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
    
    # -----------------------
    # INVOICE REPOSITORY
    # -----------------------
    def get_invoice_report_rows(
        self,
        company_id: UUID,
        filters: InvoiceReportFilter,
    ):
        query = (
            self.db.query(
                Invoice.id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),

                Invoice.supplier_id.label("supplier_id"),
                Supplier.name.label("supplier_name"),

                Invoice.purchase_order_id.label("purchase_order_id"),
                PurchaseOrder.po_number.label("po_number"),

                InvoiceLineItem.id.label("item_id"),
                InvoiceLineItem.description.label("item_description"),
                InvoiceLineItem.invoiced_quantity.label("quantity"),
                InvoiceLineItem.unit_price.label("unit_price"),
                InvoiceLineItem.total_price.label("line_total"),

                Invoice.total_amount.label("invoice_total_amount"),
                Invoice.currency.label("currency"),

                Invoice.exchange_rate.label("exchange_rate"),
                Invoice.base_currency.label("base_currency"),
                Invoice.base_amount.label("base_amount"),
                Invoice.exchange_rate_date.label("exchange_rate_date"),

                Invoice.status.label("status"),
                Invoice.created_at.label("created_at"),
            )
            .join(
                Supplier,
                (Invoice.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .outerjoin(
                PurchaseOrder,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                & (PurchaseOrder.company_id == company_id),
            )
            .join(
                InvoiceLineItem,
                (InvoiceLineItem.invoice_id == Invoice.id)
                & (InvoiceLineItem.company_id == company_id),
            )
            .filter(Invoice.company_id == company_id)
        )

        query = self._apply_invoice_filters(query, filters)

        return (
            query.order_by(
                Invoice.created_at.desc(),
                Invoice.invoice_number.asc(),
            )
            .offset(filters.skip)
            .limit(filters.limit)
            .all()
        )


    def count_invoice_report_rows(
        self,
        company_id: UUID,
        filters: InvoiceReportFilter,
    ) -> int:
        query = (
            self.db.query(InvoiceLineItem.id)
            .join(
                Invoice,
                (InvoiceLineItem.invoice_id == Invoice.id)
                & (Invoice.company_id == company_id),
            )
            .join(
                Supplier,
                (Invoice.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .outerjoin(
                PurchaseOrder,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                & (PurchaseOrder.company_id == company_id),
            )
            .filter(InvoiceLineItem.company_id == company_id)
        )

        query = self._apply_invoice_filters(query, filters)

        subquery = query.subquery()

        return self.db.query(func.count()).select_from(subquery).scalar() or 0
    
    def _apply_invoice_filters(
        self,
        query,
        filters: InvoiceReportFilter,
    ):
        if filters.status:
            query = query.filter(Invoice.status == filters.status)

        if filters.supplier_id:
            query = query.filter(Invoice.supplier_id == filters.supplier_id)

        if filters.purchase_order_id:
            query = query.filter(Invoice.purchase_order_id == filters.purchase_order_id)

        if filters.date_from:
            query = query.filter(Invoice.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Invoice.created_at <= filters.date_to)

        if filters.min_amount is not None:
            query = query.filter(Invoice.total_amount >= filters.min_amount)

        if filters.max_amount is not None:
            query = query.filter(Invoice.total_amount <= filters.max_amount)

        return query
    
    # -------------------------
    # OUTSTANDING INVOICE REPORT
    # --------------------------
    def get_outstanding_invoice_report_rows(
        self,
        company_id: UUID,
        filters: OutstandingInvoiceReportFilter,
    ):
        amount_paid = func.coalesce(func.sum(Payment.amount), 0)
        outstanding_amount = Invoice.total_amount - amount_paid

        query = (
            self.db.query(
                Invoice.id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),
                Invoice.supplier_id.label("supplier_id"),
                Supplier.name.label("supplier_name"),
                Invoice.purchase_order_id.label("purchase_order_id"),
                PurchaseOrder.po_number.label("po_number"),
                Invoice.total_amount.label("total_amount"),
                amount_paid.label("amount_paid"),
                outstanding_amount.label("outstanding_amount"),
                Invoice.currency.label("currency"),
                Invoice.base_currency.label("base_currency"),
                Invoice.base_amount.label("base_total_amount"),

                func.coalesce(func.sum(Payment.base_amount), 0).label(
                    "base_amount_paid"
                ),

                (
                    Invoice.base_amount
                    - func.coalesce(func.sum(Payment.base_amount), 0)
                ).label("base_outstanding_amount"),

                Invoice.status.label("status"),
                Invoice.created_at.label("created_at"),
            )
            .join(Supplier, Invoice.supplier_id == Supplier.id)
            .outerjoin(
                PurchaseOrder,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                & (PurchaseOrder.company_id == company_id),
            )
            .outerjoin(
                Payment,
                (Payment.invoice_id == Invoice.id)
                & (Payment.company_id == company_id),
            )
            .filter(
                Invoice.company_id == company_id,
                Supplier.company_id == company_id,
                Invoice.status != InvoiceStatusEnum.DRAFT,
            )
            .group_by(
                Invoice.id,
                Invoice.invoice_number,
                Invoice.supplier_id,
                Supplier.name,
                Invoice.purchase_order_id,
                PurchaseOrder.po_number,
                Invoice.total_amount,
                Invoice.currency,
                Invoice.base_currency,
                Invoice.base_amount,
                Invoice.status,
                Invoice.created_at,
            )
            .having(outstanding_amount > 0)
        )

        query = self._apply_outstanding_invoice_filters(
            query=query,
            filters=filters,
            outstanding_amount=outstanding_amount,
        )

        return (
            query.order_by(Invoice.created_at.desc())
            .offset(filters.skip)
            .limit(filters.limit)
            .all()
        )


    def count_outstanding_invoice_report_rows(
        self,
        company_id: UUID,
        filters: OutstandingInvoiceReportFilter,
    ) -> int:
        amount_paid = func.coalesce(func.sum(Payment.amount), 0)
        outstanding_amount = Invoice.total_amount - amount_paid

        subquery = (
            self.db.query(
                Invoice.id.label("invoice_id"),
            )
            .join(Supplier, Invoice.supplier_id == Supplier.id)
            .outerjoin(
                PurchaseOrder,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                &(PurchaseOrder.company_id == company_id),
            )
            .outerjoin(
                Payment,
                (Payment.invoice_id == Invoice.id)
                & (Payment.company_id == company_id),
            )
            .filter(
                Invoice.company_id == company_id,
                Supplier.company_id == company_id,
                Invoice.status != InvoiceStatusEnum.DRAFT,
            )
            .group_by(
                Invoice.id,
                Invoice.total_amount,
            )
            .having(outstanding_amount > 0)
        )

        subquery = self._apply_outstanding_invoice_filters(
        query=subquery,
        filters=filters,
        outstanding_amount=outstanding_amount,
    ).subquery()

        return self.db.query(func.count()).select_from(subquery).scalar() or 0


    def _apply_outstanding_invoice_filters(           
        self,
        query,
        filters: OutstandingInvoiceReportFilter,
        outstanding_amount,
    ):
        if filters.supplier_id:
            query = query.filter(Invoice.supplier_id == filters.supplier_id)

        if filters.purchase_order_id:
            query = query.filter(Invoice.purchase_order_id == filters.purchase_order_id)

        if filters.date_from:
            query = query.filter(Invoice.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Invoice.created_at <= filters.date_to)

        if filters.min_outstanding_amount is not None:
            query = query.having(outstanding_amount >= filters.min_outstanding_amount)

        if filters.max_outstanding_amount is not None:
            query = query.having(outstanding_amount <= filters.max_outstanding_amount)

        return query 
    
    def get_outstanding_invoice_detail(
        self,
        company_id: UUID,
        invoice_id: UUID,
    ):
        amount_paid = func.coalesce(func.sum(Payment.amount), 0)
        outstanding_amount = Invoice.total_amount - amount_paid

        return (
            self.db.query(
                Invoice.id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),
                Invoice.supplier_id.label("supplier_id"),
                Supplier.name.label("supplier_name"),
                Invoice.purchase_order_id.label("purchase_order_id"),
                PurchaseOrder.po_number.label("po_number"),
                Invoice.total_amount.label("total_amount"),
                amount_paid.label("amount_paid"),
                outstanding_amount.label("outstanding_amount"),
                Invoice.currency.label("currency"),

                Invoice.base_currency.label("base_currency"),
                Invoice.base_amount.label("base_total_amount"),

                func.coalesce(func.sum(Payment.base_amount), 0).label(
                    "base_amount_paid"
                ),

                (
                    Invoice.base_amount
                    - func.coalesce(func.sum(Payment.base_amount), 0)
                ).label("base_outstanding_amount"),

                Invoice.status.label("status"),
                Invoice.created_at.label("created_at"),
            )
            .join(
                Supplier,
                (Invoice.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .outerjoin(
                PurchaseOrder,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                & (PurchaseOrder.company_id == company_id),
            )
            .outerjoin(
                Payment,
                (Payment.invoice_id == Invoice.id)
                & (Payment.company_id == company_id),
            )
            .filter(
                Invoice.id == invoice_id,
                Invoice.company_id == company_id,
                Invoice.status != InvoiceStatusEnum.DRAFT,
            )
            .group_by(
                Invoice.id,
                Invoice.invoice_number,
                Invoice.supplier_id,
                Supplier.name,
                Invoice.purchase_order_id,
                PurchaseOrder.po_number,
                Invoice.total_amount,
                Invoice.currency,
                Invoice.base_currency,
                Invoice.base_amount,
                Invoice.status,
                Invoice.created_at,
            )
            .having(outstanding_amount > 0)
            .first()
        )
    
    # ----------------------
    # SUPPLIER SPEND REPORT
    # ---------------------

    def get_supplier_spend_report_rows(
        self,
        company_id: UUID,
        filters: SupplierSpendReportFilter,
    ):
        invoice_totals_subquery = (
            self.db.query(
                Invoice.supplier_id.label("supplier_id"),
                func.coalesce(func.sum(Invoice.total_amount), 0).label("total_invoice_amount"),
                func.coalesce(func.sum(Invoice.base_amount), 0).label("base_total_invoice_amount"),
                func.max(Invoice.base_currency).label("base_currency"),
                func.count(Invoice.id).label("invoice_count"),
            )
            .filter(
                Invoice.company_id == company_id,
                Invoice.status != InvoiceStatusEnum.DRAFT,
            )
            .group_by(Invoice.supplier_id)
            .subquery()
        )

        payment_totals_subquery = (
            self.db.query(
                Invoice.supplier_id.label("supplier_id"),
                func.coalesce(func.sum(Payment.amount), 0).label("total_paid_amount"),
                func.coalesce(func.sum(Payment.base_amount), 0).label("base_total_paid_amount"),
                func.count(Payment.id).label("payment_count"),
            )
            .join(
                Invoice,
                (Payment.invoice_id == Invoice.id)
                & (Invoice.company_id == company_id),
            )
            .filter(Payment.company_id == company_id)
            .group_by(Invoice.supplier_id)
            .subquery()
        )

        total_invoice_amount = func.coalesce(
            invoice_totals_subquery.c.total_invoice_amount,
            0,
        )
        total_paid_amount = func.coalesce(
            payment_totals_subquery.c.total_paid_amount,
            0,
        )
        base_total_invoice_amount = func.coalesce(
            invoice_totals_subquery.c.base_total_invoice_amount,
            0,
        )
        base_total_paid_amount = func.coalesce(
            payment_totals_subquery.c.base_total_paid_amount,
            0,
        )

        query = (
            self.db.query(
                Supplier.id.label("supplier_id"),
                Supplier.name.label("supplier_name"),

                total_invoice_amount.label("total_invoice_amount"),
                total_paid_amount.label("total_paid_amount"),
                (total_invoice_amount - total_paid_amount).label("outstanding_amount"),

                invoice_totals_subquery.c.base_currency.label("base_currency"),
                base_total_invoice_amount.label("base_total_invoice_amount"),
                base_total_paid_amount.label("base_total_paid_amount"),
                (
                    base_total_invoice_amount - base_total_paid_amount
                ).label("base_outstanding_amount"),

                func.coalesce(invoice_totals_subquery.c.invoice_count, 0).label("invoice_count"),
                func.coalesce(payment_totals_subquery.c.payment_count, 0).label("payment_count"),
            )
            .join(
                invoice_totals_subquery,
                invoice_totals_subquery.c.supplier_id == Supplier.id,
            )
            .outerjoin(
                payment_totals_subquery,
                payment_totals_subquery.c.supplier_id == Supplier.id,
            )
            .filter(Supplier.company_id == company_id)
        )

        query = self._apply_supplier_spend_filters(
            query=query,
            filters=filters,
            total_invoice_amount=base_total_invoice_amount,
            total_paid_amount=base_total_paid_amount,
        )

        return (
            query.order_by(base_total_invoice_amount.desc())
            .offset(filters.skip)
            .limit(filters.limit)
            .all()
        )


    def count_supplier_spend_report_rows(
        self,
        company_id: UUID,
        filters: SupplierSpendReportFilter,
    ) -> int:
        invoice_totals_subquery = (
            self.db.query(
                Invoice.supplier_id.label("supplier_id"),
                func.coalesce(func.sum(Invoice.base_amount), 0).label(
                    "base_total_invoice_amount"
                ),
            )
            .filter(
                Invoice.company_id == company_id,
                Invoice.status != InvoiceStatusEnum.DRAFT,
            )
            .group_by(Invoice.supplier_id)
            .subquery()
        )

        payment_totals_subquery = (
            self.db.query(
                Invoice.supplier_id.label("supplier_id"),
                func.coalesce(func.sum(Payment.base_amount), 0).label(
                    "base_total_paid_amount"
                ),
            )
            .join(
                Invoice,
                (Payment.invoice_id == Invoice.id)
                & (Invoice.company_id == company_id),
            )
            .filter(Payment.company_id == company_id)
            .group_by(Invoice.supplier_id)
            .subquery()
        )

        base_total_invoice_amount = func.coalesce(
            invoice_totals_subquery.c.base_total_invoice_amount,
            0,
        )
        base_total_paid_amount = func.coalesce(
            payment_totals_subquery.c.base_total_paid_amount,
            0,
        )

        query = (
            self.db.query(Supplier.id.label("supplier_id"))
            .join(
                invoice_totals_subquery,
                invoice_totals_subquery.c.supplier_id == Supplier.id,
            )
            .outerjoin(
                payment_totals_subquery,
                payment_totals_subquery.c.supplier_id == Supplier.id,
            )
            .filter(Supplier.company_id == company_id)
        )

        query = self._apply_supplier_spend_filters(
            query=query,
            filters=filters,
            total_invoice_amount=base_total_invoice_amount,
            total_paid_amount=base_total_paid_amount,
        ).subquery()

        return self.db.query(func.count()).select_from(query).scalar() or 0

    def _apply_supplier_spend_filters(
        self,
        query,
        filters: SupplierSpendReportFilter,
        total_invoice_amount,
        total_paid_amount,
    ):
        if filters.supplier_id:
            query = query.filter(Supplier.id == filters.supplier_id)

        if filters.date_from:
            query = query.filter(Invoice.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(Invoice.created_at <= filters.date_to)

        if filters.min_total_invoice_amount is not None:
            query = query.having(total_invoice_amount >= filters.min_total_invoice_amount)

        if filters.max_total_invoice_amount is not None:
            query = query.having(total_invoice_amount <= filters.max_total_invoice_amount)

        if filters.min_total_paid_amount is not None:
            query = query.having(total_paid_amount >= filters.min_total_paid_amount)

        if filters.max_total_paid_amount is not None:
            query = query.having(total_paid_amount <= filters.max_total_paid_amount)

        return query
    
    # Supplier spend Detail 

    def get_supplier_spend_detail_summary(
        self,
        company_id: UUID,
        supplier_id: UUID,
    ):
        invoice_totals_subquery = (
            self.db.query(
                Invoice.supplier_id.label("supplier_id"),
                func.coalesce(func.sum(Invoice.total_amount), 0).label(
                    "total_invoice_amount"
                ),
                func.coalesce(func.sum(Invoice.base_amount), 0).label(
                    "base_total_invoice_amount"
                ),
                func.max(Invoice.base_currency).label("base_currency"),
                func.count(Invoice.id).label("invoice_count"),
            )
            .filter(
                Invoice.company_id == company_id,
                Invoice.supplier_id == supplier_id,
                Invoice.status != InvoiceStatusEnum.DRAFT,
            )
            .group_by(Invoice.supplier_id)
            .subquery()
        )

        payment_totals_subquery = (
            self.db.query(
                Invoice.supplier_id.label("supplier_id"),
                func.coalesce(func.sum(Payment.amount), 0).label("total_paid_amount"),
                func.coalesce(func.sum(Payment.base_amount), 0).label(
                    "base_total_paid_amount"
                ),
                func.count(Payment.id).label("payment_count"),
            )
            .join(
                Invoice,
                (Payment.invoice_id == Invoice.id)
                & (Invoice.company_id == company_id),
            )
            .filter(
                Payment.company_id == company_id,
                Invoice.supplier_id == supplier_id,
            )
            .group_by(Invoice.supplier_id)
            .subquery()
        )

        total_invoice_amount = func.coalesce(
            invoice_totals_subquery.c.total_invoice_amount,
            0,
        )

        total_paid_amount = func.coalesce(
            payment_totals_subquery.c.total_paid_amount,
            0,
        )

        base_total_invoice_amount = func.coalesce(
            invoice_totals_subquery.c.base_total_invoice_amount,
            0,
        )

        base_total_paid_amount = func.coalesce(
            payment_totals_subquery.c.base_total_paid_amount,
            0,
        )

        return (
            self.db.query(
                Supplier.id.label("supplier_id"),
                Supplier.name.label("supplier_name"),

                total_invoice_amount.label("total_invoice_amount"),
                total_paid_amount.label("total_paid_amount"),
                (total_invoice_amount - total_paid_amount).label("outstanding_amount"),

                invoice_totals_subquery.c.base_currency.label("base_currency"),
                base_total_invoice_amount.label("base_total_invoice_amount"),
                base_total_paid_amount.label("base_total_paid_amount"),
                (
                    base_total_invoice_amount - base_total_paid_amount
                ).label("base_outstanding_amount"),

                func.coalesce(invoice_totals_subquery.c.invoice_count, 0).label(
                    "invoice_count"
                ),
                func.coalesce(payment_totals_subquery.c.payment_count, 0).label(
                    "payment_count"
                ),
            )
            .outerjoin(
                invoice_totals_subquery,
                invoice_totals_subquery.c.supplier_id == Supplier.id,
            )
            .outerjoin(
                payment_totals_subquery,
                payment_totals_subquery.c.supplier_id == Supplier.id,
            )
            .filter(
                Supplier.id == supplier_id,
                Supplier.company_id == company_id,
            )
            .first()
        )

    def get_supplier_spend_detail_invoices(
        self,
        company_id: UUID,
        supplier_id: UUID,
    ):
        amount_paid = func.coalesce(func.sum(Payment.amount), 0)
        outstanding_amount = Invoice.total_amount - amount_paid

        base_amount_paid = func.coalesce(func.sum(Payment.base_amount), 0)
        base_outstanding_amount = Invoice.base_amount - base_amount_paid

        return (
            self.db.query(
                Invoice.id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),
                Invoice.purchase_order_id.label("purchase_order_id"),
                PurchaseOrder.po_number.label("po_number"),

                Invoice.total_amount.label("total_amount"),
                amount_paid.label("amount_paid"),
                outstanding_amount.label("outstanding_amount"),
                Invoice.currency.label("currency"),

                Invoice.base_currency.label("base_currency"),
                Invoice.base_amount.label("base_total_amount"),
                base_amount_paid.label("base_amount_paid"),
                base_outstanding_amount.label("base_outstanding_amount"),

                Invoice.status.label("status"),
                Invoice.created_at.label("created_at"),
            )
            .outerjoin(
                PurchaseOrder,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                & (PurchaseOrder.company_id == company_id),
            )
            .outerjoin(
                Payment,
                (Payment.invoice_id == Invoice.id)
                & (Payment.company_id == company_id),
            )
            .filter(
                Invoice.company_id == company_id,
                Invoice.supplier_id == supplier_id,
                Invoice.status != InvoiceStatusEnum.DRAFT,
            )
            .group_by(
                Invoice.id,
                Invoice.invoice_number,
                Invoice.purchase_order_id,
                PurchaseOrder.po_number,
                Invoice.total_amount,
                Invoice.currency,
                Invoice.base_currency,
                Invoice.base_amount,
                Invoice.status,
                Invoice.created_at,
            )
            .order_by(Invoice.created_at.desc())
            .all()
        )


    def get_supplier_spend_detail_payments(
        self,
        company_id: UUID,
        supplier_id: UUID,
    ):
        return (
            self.db.query(
                Payment.id.label("payment_id"),
                Payment.reference.label("payment_reference"),

                Payment.invoice_id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),

                Payment.amount.label("amount"),
                Payment.currency.label("currency"),

                Payment.exchange_rate.label("exchange_rate"),
                Payment.base_currency.label("base_currency"),
                Payment.base_amount.label("base_amount"),
                Payment.exchange_rate_date.label("exchange_rate_date"),

                Payment.payment_method.label("payment_method"),
                Payment.status.label("status"),

                Payment.paid_at.label("paid_at"),
                Payment.created_at.label("created_at"),
            )
            .join(
                Invoice,
                (Payment.invoice_id == Invoice.id)
                & (Invoice.company_id == company_id),
            )
            .filter(
                Payment.company_id == company_id,
                Invoice.supplier_id == supplier_id,
            )
            .order_by(Payment.created_at.desc())
            .all()
        )
    # ----------------------
    # PR REPO REPORT
    # ---------------------

    def get_pr_report_rows(
        self,
        company_id: UUID,
        filters: PRReportFilter,
    ):
        query = (
            self.db.query(
                PurchaseRequisition.id.label("pr_id"),
                PurchaseRequisition.pr_number.label("pr_number"),
                PurchaseRequisition.title.label("title"),
                PurchaseRequisition.department_id.label("department_id"),
                Department.name.label("department_name"),
                PurchaseRequisition.requested_by.label("requested_by_id"),
                User.name.label("requested_by_name"),
                PurchaseRequisition.total_amount.label("pr_total_amount"),
                PurchaseRequisition.currency.label("currency"),

                PurchaseRequisition.exchange_rate.label("exchange_rate"),
                PurchaseRequisition.base_currency.label("base_currency"),
                PurchaseRequisition.base_amount.label("base_amount"),
                PurchaseRequisition.exchange_rate_date.label("exchange_rate_date"),

                PurchaseRequisition.status.label("status"),
                PurchaseRequisition.created_at.label("created_at"),

                PurchaseRequisitionItem.id.label("item_id"),
                PurchaseRequisitionItem.item_name.label("item_name"),
                PurchaseRequisitionItem.quantity.label("quantity"),
                PurchaseRequisitionItem.unit_price.label("unit_price"),
                PurchaseRequisitionItem.line_total.label("line_total"),
            )
            .outerjoin(
                Department,
                (PurchaseRequisition.department_id == Department.id)
                & (Department.company_id == company_id),
            )
            .outerjoin(
                User,
                (PurchaseRequisition.requested_by == User.id)
                & (User.company_id == company_id),
            )
            .join(
                PurchaseRequisitionItem,
                (PurchaseRequisitionItem.requisition_id == PurchaseRequisition.id)
                & (PurchaseRequisitionItem.company_id == company_id),
            )
            .filter(
                PurchaseRequisition.company_id == company_id,
                PurchaseRequisition.is_active == True,
            )
        )

        query = self._apply_pr_filters(query, filters)

        return (
            query.order_by(
                PurchaseRequisition.created_at.desc(),
                PurchaseRequisition.pr_number.asc(),
            )
            .offset(filters.skip)
            .limit(filters.limit)
            .all()
        )


    def count_pr_report_rows(
        self,
        company_id: UUID,
        filters: PRReportFilter,
    ) -> int:
        query = (
            self.db.query(PurchaseRequisition.id)
            .outerjoin(
                Department,
                (PurchaseRequisition.department_id == Department.id)
                & (Department.company_id == company_id),
            )
            .filter(
                PurchaseRequisition.company_id == company_id,
                PurchaseRequisition.is_active == True,
            )
        )

        query = self._apply_pr_filters(query, filters)

        subquery = query.subquery()

        return self.db.query(func.count()).select_from(subquery).scalar() or 0


    def _apply_pr_filters(
        self,
        query,
        filters: PRReportFilter,
    ):
        if filters.status:
            query = query.filter(PurchaseRequisition.status == filters.status)

        if filters.department_id:
            query = query.filter(PurchaseRequisition.department_id == filters.department_id)

        if filters.requested_by:
            query = query.filter(PurchaseRequisition.requested_by == filters.requested_by)

        if filters.date_from:
            query = query.filter(PurchaseRequisition.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(PurchaseRequisition.created_at <= filters.date_to)

        if filters.min_amount is not None:
            query = query.filter(PurchaseRequisition.total_amount >= filters.min_amount)

        if filters.max_amount is not None:
            query = query.filter(PurchaseRequisition.total_amount <= filters.max_amount)

        return query
    
    # ----------------------
    # PO REPO REPORT
    # ---------------------
    def get_po_report_rows(
        self,
        company_id: UUID,
        filters: POReportFilter,
    ):
        CreatedByUser = aliased(User)
        SubmittedByUser = aliased(User)
        IssuedByUser = aliased(User)

        query = (
            self.db.query(
                PurchaseOrder.id.label("po_id"),
                PurchaseOrder.po_number.label("po_number"),

                PurchaseOrder.supplier_id.label("supplier_id"),
                Supplier.name.label("supplier_name"),

                PurchaseOrder.department_id.label("department_id"),
                Department.name.label("department_name"),

                PurchaseOrder.purchase_requisition_id.label("purchase_requisition_id"),
                PurchaseRequisition.pr_number.label("pr_number"),

                CreatedByUser.name.label("created_by_name"),
                SubmittedByUser.name.label("submitted_by_name"),
                IssuedByUser.name.label("issued_by_name"),

                PurchaseOrderItem.id.label("item_id"),
                PurchaseOrderItem.item_name.label("item_name"),
                PurchaseOrderItem.quantity.label("quantity"),
                PurchaseOrderItem.unit_price.label("unit_price"),
                (
                    PurchaseOrderItem.quantity * PurchaseOrderItem.unit_price
                ).label("line_total"),
                PurchaseOrder.total_amount.label("po_total_amount"),
                PurchaseOrder.currency.label("currency"),

                PurchaseOrder.exchange_rate.label("exchange_rate"),
                PurchaseOrder.base_currency.label("base_currency"),
                PurchaseOrder.base_amount.label("base_amount"),
                PurchaseOrder.exchange_rate_date.label("exchange_rate_date"),

                PurchaseOrder.status.label("status"),

                PurchaseOrder.created_at.label("created_at"),
                PurchaseOrder.submitted_at.label("submitted_at"),
                PurchaseOrder.issued_at.label("issued_at"),
            )
            .join(
                Supplier,
                (PurchaseOrder.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .outerjoin(
                Department,
                (PurchaseOrder.department_id == Department.id)
                & (Department.company_id == company_id),
            )
            .outerjoin(
                PurchaseRequisition,
                (PurchaseOrder.purchase_requisition_id == PurchaseRequisition.id)
                & (PurchaseRequisition.company_id == company_id),
            )
            .outerjoin(
                CreatedByUser,
                (PurchaseOrder.created_by == CreatedByUser.id)
                & (CreatedByUser.company_id == company_id),
            )
            .outerjoin(
                SubmittedByUser,
                (PurchaseOrder.submitted_by == SubmittedByUser.id)
                & (SubmittedByUser.company_id == company_id),
            )
            .outerjoin(
                IssuedByUser,
                (PurchaseOrder.issued_by == IssuedByUser.id)
                & (IssuedByUser.company_id == company_id),
            )
            .join(
                PurchaseOrderItem,
                (PurchaseOrderItem.purchase_order_id == PurchaseOrder.id)
                & (PurchaseOrderItem.company_id == company_id),
            )
            .filter(PurchaseOrder.company_id == company_id)
        )

        query = self._apply_po_filters(query, filters)

        return (
            query.order_by(
                PurchaseOrder.created_at.desc(),
                PurchaseOrder.po_number.asc(),
            )
            .offset(filters.skip)
            .limit(filters.limit)
            .all()
        )

    def count_po_report_rows(
        self,
        company_id: UUID,
        filters: POReportFilter,
    ) -> int:
        query = (
            self.db.query(PurchaseOrderItem.id)
            .join(
                PurchaseOrder,
                (PurchaseOrderItem.purchase_order_id == PurchaseOrder.id)
                & (PurchaseOrder.company_id == company_id),
            )
            .join(
                Supplier,
                (PurchaseOrder.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .outerjoin(
                Department,
                (PurchaseOrder.department_id == Department.id)
                & (Department.company_id == company_id),
            )
            .outerjoin(
                PurchaseRequisition,
                (PurchaseOrder.purchase_requisition_id == PurchaseRequisition.id)
                & (PurchaseRequisition.company_id == company_id),
            )
            .filter(PurchaseOrderItem.company_id == company_id)
        )

        query = self._apply_po_filters(query, filters)

        subquery = query.subquery()

        return self.db.query(func.count()).select_from(subquery).scalar() or 0

    def _apply_po_filters(
        self,
        query,
        filters: POReportFilter,
    ):
        if filters.status:
            query = query.filter(PurchaseOrder.status == filters.status)

        if filters.supplier_id:
            query = query.filter(PurchaseOrder.supplier_id == filters.supplier_id)

        if filters.department_id:
            query = query.filter(PurchaseOrder.department_id == filters.department_id)

        if filters.purchase_requisition_id:
            query = query.filter(
                PurchaseOrder.purchase_requisition_id == filters.purchase_requisition_id
            )

        if filters.date_from:
            query = query.filter(PurchaseOrder.created_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(PurchaseOrder.created_at <= filters.date_to)

        if filters.min_amount is not None:
            query = query.filter(PurchaseOrder.total_amount >= filters.min_amount)

        if filters.max_amount is not None:
            query = query.filter(PurchaseOrder.total_amount <= filters.max_amount)

        return query
    
    # ----------------------
    # SUPPLIER LEAD TIME REPO
    # ------------------------

    def get_supplier_lead_time_report_rows(
        self,
        company_id: UUID,
        filters: SupplierLeadTimeReportFilter,
    ):
        lead_time_days = (
            func.extract("epoch", Invoice.created_at - PurchaseOrder.issued_at) / 86400
        )

        query = (
            self.db.query(
                PurchaseOrder.id.label("po_id"),
                PurchaseOrder.po_number.label("po_number"),
                PurchaseOrder.supplier_id.label("supplier_id"),
                Supplier.name.label("supplier_name"),
                Invoice.id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),
                PurchaseOrder.issued_at.label("issued_at"),
                Invoice.created_at.label("invoice_created_at"),
                lead_time_days.label("lead_time_days"),
            )
            .join(
                Supplier,
                (PurchaseOrder.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .join(
                Invoice,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                & (Invoice.company_id == company_id),
            )
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.issued_at.isnot(None),
            )
        )

        query = self._apply_supplier_lead_time_filters(
            query=query,
            filters=filters,
            lead_time_days=lead_time_days,
        )

        return (
            query.order_by(lead_time_days.desc())
            .offset(filters.skip)
            .limit(filters.limit)
            .all()
        )


    def count_supplier_lead_time_report_rows(
        self,
        company_id: UUID,
        filters: SupplierLeadTimeReportFilter,
    ) -> int:
        lead_time_days = (
            # Assuming that the invoice get's created once items have been received
            func.extract("epoch", Invoice.created_at - PurchaseOrder.issued_at) / 86400
        )

        query = (
            self.db.query(PurchaseOrder.id)
            .join(
                Supplier,
                (PurchaseOrder.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .join(
                Invoice,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                & (Invoice.company_id == company_id),
            )
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.issued_at.isnot(None),
            )
        )

        query = self._apply_supplier_lead_time_filters(
            query=query,
            filters=filters,
            lead_time_days=lead_time_days,
        )

        subquery = query.subquery()

        return self.db.query(func.count()).select_from(subquery).scalar() or 0


    def _apply_supplier_lead_time_filters(
        self,
        query,
        filters: SupplierLeadTimeReportFilter,
        lead_time_days,
    ):
        if filters.supplier_id:
            query = query.filter(PurchaseOrder.supplier_id == filters.supplier_id)

        if filters.date_from:
            query = query.filter(PurchaseOrder.issued_at >= filters.date_from)

        if filters.date_to:
            query = query.filter(PurchaseOrder.issued_at <= filters.date_to)

        if filters.min_lead_time_days is not None:
            query = query.filter(lead_time_days >= filters.min_lead_time_days)

        if filters.max_lead_time_days is not None:
            query = query.filter(lead_time_days <= filters.max_lead_time_days)

        return query
    
    # Supplier lead time detail
    def get_supplier_lead_time_detail(
        self,
        company_id: UUID,
        po_id: UUID,
    ):
        lead_time_days = (
            func.extract("epoch", Invoice.created_at - PurchaseOrder.issued_at) / 86400
        )

        return (
            self.db.query(
                PurchaseOrder.id.label("po_id"),
                PurchaseOrder.po_number.label("po_number"),

                PurchaseOrder.supplier_id.label("supplier_id"),
                Supplier.name.label("supplier_name"),

                Invoice.id.label("invoice_id"),
                Invoice.invoice_number.label("invoice_number"),

                PurchaseOrder.issued_at.label("issued_at"),
                Invoice.created_at.label("invoice_created_at"),
                lead_time_days.label("lead_time_days"),

                PurchaseOrder.status.label("po_status"),
                Invoice.status.label("invoice_status"),
            )
            .join(
                Supplier,
                (PurchaseOrder.supplier_id == Supplier.id)
                & (Supplier.company_id == company_id),
            )
            .outerjoin(
                Invoice,
                (Invoice.purchase_order_id == PurchaseOrder.id)
                & (Invoice.company_id == company_id),
            )
            .filter(
                PurchaseOrder.id == po_id,
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.issued_at.isnot(None),
            )
            .order_by(Invoice.created_at.asc())
            .first()
        )