from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.invoice_line_item import InvoiceLineItem


class InvoiceLineItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        line_item: InvoiceLineItem,
    ) -> InvoiceLineItem:
        self.db.add(line_item)
        self.db.flush()
        self.db.refresh(line_item)
        return line_item

    def get_by_id(
        self,
        line_item_id: UUID,
        company_id: UUID,
    ) -> Optional[InvoiceLineItem]:
        return (
            self.db.query(InvoiceLineItem)
            .filter(
                InvoiceLineItem.id == line_item_id,
                InvoiceLineItem.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
    ) -> list[InvoiceLineItem]:
        return (
            self.db.query(InvoiceLineItem)
            .filter(InvoiceLineItem.company_id == company_id)
            .order_by(InvoiceLineItem.created_at.asc())
            .all()
        )

    def get_all_by_invoice(
        self,
        invoice_id: UUID,
        company_id: UUID,
    ) -> list[InvoiceLineItem]:
        return (
            self.db.query(InvoiceLineItem)
            .filter(
                InvoiceLineItem.invoice_id == invoice_id,
                InvoiceLineItem.company_id == company_id,
            )
            .order_by(InvoiceLineItem.created_at.asc())
            .all()
        )

    def get_by_invoice_and_po_item(
        self,
        invoice_id: UUID,
        purchase_order_item_id: UUID,
        company_id: UUID,
    ) -> Optional[InvoiceLineItem]:
        return (
            self.db.query(InvoiceLineItem)
            .filter(
                InvoiceLineItem.invoice_id == invoice_id,
                InvoiceLineItem.purchase_order_item_id == purchase_order_item_id,
                InvoiceLineItem.company_id == company_id,
            )
            .first()
        )

    def update(
        self,
        line_item: InvoiceLineItem,
    ) -> InvoiceLineItem:
        self.db.flush()
        self.db.refresh(line_item)
        return line_item

    def delete(
        self,
        line_item: InvoiceLineItem,
    ) -> None:
        self.db.delete(line_item)
        self.db.flush()