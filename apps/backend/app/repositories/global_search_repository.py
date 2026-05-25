from uuid import UUID

from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.models.invoice import Invoice
from app.models.payments import Payment
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_requisition import PurchaseRequisition
from app.models.supplier import Supplier
from app.models.user import User


class GlobalSearchRepository:
    def __init__(self, db: Session):
        self.db = db

    def search_purchase_requisitions(
        self,
        company_id: UUID,
        query: str,
        limit: int,
    ) -> list[PurchaseRequisition]:
        pattern = f"%{query}%"

        return (
            self.db.query(PurchaseRequisition)
            .options(
                joinedload(PurchaseRequisition.department),
                joinedload(PurchaseRequisition.requester),
            )
            .filter(
                PurchaseRequisition.company_id == company_id,
                or_(
                    PurchaseRequisition.pr_number.ilike(pattern),
                    PurchaseRequisition.title.ilike(pattern),
                ),
            )
            .order_by(PurchaseRequisition.created_at.desc())
            .limit(limit)
            .all()
        )

    def search_purchase_orders(
        self,
        company_id: UUID,
        query: str,
        limit: int,
    ) -> list[PurchaseOrder]:
        pattern = f"%{query}%"

        return (
            self.db.query(PurchaseOrder)
            .join(PurchaseOrder.supplier)
            .options(
                joinedload(PurchaseOrder.supplier),
                joinedload(PurchaseOrder.creator),
                joinedload(PurchaseOrder.purchase_requisition),
            )
            .filter(
                PurchaseOrder.company_id == company_id,
                or_(
                    PurchaseOrder.po_number.ilike(pattern),
                    Supplier.name.ilike(pattern),
                ),
            )
            .order_by(PurchaseOrder.created_at.desc())
            .limit(limit)
            .all()
        )

    def search_invoices(
        self,
        company_id: UUID,
        query: str,
        limit: int,
    ) -> list[Invoice]:
        pattern = f"%{query}%"

        return (
            self.db.query(Invoice)
            .join(Invoice.supplier)
            .outerjoin(Invoice.purchase_order)
            .options(
                joinedload(Invoice.supplier),
                joinedload(Invoice.purchase_order),
                joinedload(Invoice.submitted_by_user),
                joinedload(Invoice.submitted_by_supplier_user),
            )
            .filter(
                Invoice.company_id == company_id,
                or_(
                    Invoice.invoice_number.ilike(pattern),
                    Supplier.name.ilike(pattern),
                    PurchaseOrder.po_number.ilike(pattern),
                ),
            )
            .order_by(Invoice.created_at.desc())
            .limit(limit)
            .all()
        )

    def search_payments(
        self,
        company_id: UUID,
        query: str,
        limit: int,
    ) -> list[Payment]:
        pattern = f"%{query}%"

        return (
            self.db.query(Payment)
            .join(Payment.invoice)
            .join(Invoice.supplier)
            .options(
                joinedload(Payment.invoice).joinedload(Invoice.supplier),
                joinedload(Payment.created_by_user),
            )
            .filter(
                Payment.company_id == company_id,
                or_(
                    Payment.reference.ilike(pattern),
                    Invoice.invoice_number.ilike(pattern),
                    Supplier.name.ilike(pattern),
                ),
            )
            .order_by(Payment.created_at.desc())
            .limit(limit)
            .all()
        )

    def search_suppliers(
        self,
        company_id: UUID,
        query: str,
        limit: int,
    ) -> list[Supplier]:
        pattern = f"%{query}%"

        return (
            self.db.query(Supplier)
            .filter(
                Supplier.company_id == company_id,
                or_(
                    Supplier.name.ilike(pattern),
                    Supplier.email.ilike(pattern),
                    Supplier.contact_person.ilike(pattern),
                    Supplier.phone.ilike(pattern),
                ),
            )
            .order_by(Supplier.created_at.desc())
            .limit(limit)
            .all()
        )

    def search_users(
        self,
        company_id: UUID,
        query: str,
        limit: int,
    ) -> list[User]:
        pattern = f"%{query}%"

        return (
            self.db.query(User)
            .filter(
                User.company_id == company_id,
                or_(
                    User.name.ilike(pattern),
                    User.email.ilike(pattern),
                ),
            )
            .order_by(User.created_at.desc())
            .limit(limit)
            .all()
        )