from sqlalchemy.orm import Session
from app.models.invoice import Invoice
from app.models.invoice_line_item import InvoiceLineItem
from typing import List, Optional
from uuid import UUID

# Invoice Repository
class InvoiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, invoice: Invoice) -> Invoice:
        self.db.add(invoice)
        # Flush so each commit in service layer can happen once per transaction
        self.db.flush()
        return invoice

    def get(self, invoice_id: UUID) -> Optional[Invoice]:
        return self.db.query(Invoice).filter(Invoice.id == invoice_id).first()

    def list_by_po(self, po_id: UUID) -> List[Invoice]:
        return self.db.query(Invoice).filter(Invoice.purchase_order_id == po_id).all()

    def list_by_supplier(self, supplier_id: UUID) -> List[Invoice]:
        return self.db.query(Invoice).filter(Invoice.supplier_id == supplier_id).all()

# Invoice Line repository
class InvoiceLineItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, line_item: InvoiceLineItem) -> InvoiceLineItem:
        self.db.add(line_item)
        # Flush here will help to link to the invoice by giving ID's to line item before commit happens in service layer
        self.db.flush()
        return line_item

    def list_by_invoice(self, invoice_id: UUID) -> List[InvoiceLineItem]:
        return self.db.query(InvoiceLineItem).filter(InvoiceLineItem.invoice_id == invoice_id).all()