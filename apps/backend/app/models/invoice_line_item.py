import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class InvoiceLineItem(Base):
    __tablename__ = "invoice_line_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    invoice_id = Column(
        UUID(as_uuid=True),
        ForeignKey("invoices.id"),
        nullable=False,
        index=True,
    )

    purchase_order_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("purchase_order_items.id"),
        nullable=False,
        index=True,
    )

    description = Column(String, nullable=False)

    invoiced_quantity = Column(Numeric(12, 2), nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)
    total_price = Column(Numeric(12, 2), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index(
            "ix_invoice_line_items_company_invoice",
            "company_id",
            "invoice_id",
        ),
    )

    company = relationship("Company", back_populates="invoice_line_items")

    invoice = relationship(
        "Invoice",
        back_populates="line_items",
    )

    purchase_order_item = relationship(
        "PurchaseOrderItem",
        back_populates="invoice_line_items",
    )