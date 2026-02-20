import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class PurchaseRequisitionItem(Base):
    __tablename__ = "purchase_requisition_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    requisition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("purchase_requisitions.id", ondelete="CASCADE"),
        nullable=False
    )
    description = Column(String, nullable=False)
    quantity = Column(Numeric(10,2), nullable=False)
    unit_price = Column(Numeric(14,2), nullable=False)
    line_total = Column(Numeric(14,2), nullable=False)
    created_at = Column(
    DateTime(timezone=True),
    server_default=func.now(),
    nullable=False
)  
    updated_at = Column(
    DateTime(timezone=True),
    server_default=func.now(),
    onupdate=func.now(),
    nullable=False
)
# Relationship
    requisition = relationship(
        "PurchaseRequisition",
        back_populates="items"
    )
    