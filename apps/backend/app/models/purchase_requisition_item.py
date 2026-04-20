import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class PurchaseRequisitionItem(Base):
    __tablename__ = "purchase_requisition_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    requisition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("purchase_requisitions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Added for PR → PO consistency
    item_name = Column(String, nullable=False)

    description = Column(String, nullable=False)

    quantity = Column(Numeric(10, 2), nullable=False)

    unit_price = Column(Numeric(14, 2), nullable=True)

    line_total = Column(Numeric(14, 2), nullable=True)

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
        Index("ix_pr_item_company_id_requisition_id", "company_id", "requisition_id"),
        Index("ix_pr_item_item_name", "item_name"),
    )

    company = relationship("Company", back_populates="pr_items")

    requisition = relationship(
        "PurchaseRequisition",
        back_populates="items",
    )