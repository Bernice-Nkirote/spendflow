import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Numeric, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import POStatusEnum


class PurchaseOrder(Base):
    __tablename__ = "purchase orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    po_number = Column(String, unique=True, nullable=False)

    buyer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)

    status = Column(Enum(POStatusEnum), default=POStatusEnum.DRAFT)

    total_amount = Column(Numeric(12,2), nullable=False)

    currency = Column(String, default="KES")

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    supplier = relationship("Supplier")
