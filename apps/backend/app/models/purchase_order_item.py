import uuid

from sqlalchemy import Column, String, ForeignKey, Numeric, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"


    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )

    purchase_order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("purchase_orders.id"),
        nullable=False,
    )

    item_name = Column(String, nullable=False)

    description = Column(String, nullable=True)

    quantity = Column(Numeric(10, 2), nullable=False)

    unit_price = Column(Numeric(12, 2), nullable=False)

    total_price = Column(Numeric(12, 2), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    __table_args__ = (
        Index("ix_purchase_order_items_company_id", "company_id"),
        Index("ix_purchase_order_items_purchase_order_id", "purchase_order_id"),
        Index("ix_purchase_order_items_item_name", "item_name"),
    )
    company = relationship("Company", back_populates="purchase_order_items")
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    invoice_line_items = relationship(
    "InvoiceLineItem",
    back_populates="purchase_order_item",
)