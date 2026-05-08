from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.enums import InvoiceStatusEnum
from app.models.invoice import Invoice


class InvoiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        self.db.flush()
        self.db.refresh(invoice)
        return invoice

    def get_by_id(
        self,
        invoice_id: UUID,
        company_id: UUID,
    ) -> Invoice | None:
        return (
            self.db.query(Invoice)
            .options(
                joinedload(Invoice.supplier),
                joinedload(Invoice.purchase_order),
                joinedload(Invoice.submitted_by_user),
                joinedload(Invoice.submitted_by_supplier_user),
                joinedload(Invoice.line_items),
            )
            .filter(
                Invoice.id == invoice_id,
                Invoice.company_id == company_id,
            )
            .first()
        )   

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Invoice]:
        return (
            self.db.query(Invoice)
            .filter(Invoice.company_id == company_id)
            .order_by(Invoice.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_invoice_number(
        self,
        invoice_number: str,
        company_id: UUID,
    ) -> Invoice | None:
        return (
            self.db.query(Invoice)
            .filter(
                Invoice.invoice_number == invoice_number,
                Invoice.company_id == company_id,
            )
            .first()
        )

    def get_by_purchase_order_id(
        self,
        purchase_order_id: UUID,
        company_id: UUID,
    ) -> list[Invoice]:
        return (
            self.db.query(Invoice)
            .filter(
                Invoice.purchase_order_id == purchase_order_id,
                Invoice.company_id == company_id,
            )
            .order_by(Invoice.created_at.desc())
            .all()
        )

    def get_by_status(
        self,
        status: InvoiceStatusEnum,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Invoice]:
        return (
            self.db.query(Invoice)
            .filter(
                Invoice.status == status,
                Invoice.company_id == company_id,
            )
            .order_by(Invoice.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Invoice]:
        return (
            self.db.query(Invoice)
            .filter(
                Invoice.supplier_id == supplier_id,
                Invoice.company_id == company_id,
            )
            .order_by(Invoice.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, invoice: Invoice) -> Invoice:
        self.db.flush()
        self.db.refresh(invoice)
        return invoice

    def delete(self, invoice: Invoice) -> None:
        self.db.delete(invoice)
        self.db.flush()