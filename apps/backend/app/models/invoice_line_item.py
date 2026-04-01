import uuid
from sqlalchemy import Column, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class InvoiceLineItem(Base):
    __tablename__ = "Invoice_line_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)

    purchase_order_item_id = Column(UUID(as_uuid=True),ForeignKey("purchase_order_items.id"),nullable=False)

    description = Column(String, nullable=False)

    invoiced_quantity = Column(Numeric(12, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)

    total_price = Column(Numeric(12, 2), nullable=False)

    invoice = relationship("Invoice", back_populates="line_items")
    po_item = relationship("PurchaseOrderItem")