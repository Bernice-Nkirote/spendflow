import uuid
from sqlalchemy import Column, String, ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=False)

    product_name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    quantity = Column(Numeric(10,2), nullable=False)
    unit_price = Column(Numeric(12,2), nullable=False)

    total_price = Column(Numeric(12,2), nullable=False)

    # Relationship
    purchase_order = relationship("PurchaseOrder", back_populates="items")