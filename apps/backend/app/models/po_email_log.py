import uuid

from sqlalchemy import Column, String, ForeignKey, DateTime, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.models.enums import EmailStatusEnum, email_status_enum

from app.core.database import Base


class POEmailLog(Base):
    __tablename__ = "po_email_logs"

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

    supplier_id = Column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id"),
        nullable=False,
    )

    recipient_email = Column(String, nullable=False)

    subject = Column(String, nullable=False)

    status = Column(
        email_status_enum,
        nullable=False,
        default=EmailStatusEnum.SENT,
        server_default=EmailStatusEnum.SENT.value,
    )

    error_message = Column(Text, nullable=True)

    sent_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    sent_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        Index("ix_po_email_logs_company_id", "company_id"),
        Index("ix_po_email_logs_purchase_order_id", "purchase_order_id"),
        Index("ix_po_email_logs_supplier_id", "supplier_id"),
        Index("ix_po_email_logs_sent_by", "sent_by"),
        Index("ix_po_email_logs_status", "status"),
    )

    company = relationship("Company", back_populates="po_email_logs")

    purchase_order = relationship("PurchaseOrder", back_populates="email_logs")

    supplier = relationship("Supplier", back_populates="po_email_logs")

    sender = relationship(
        "User",
        foreign_keys=[sent_by],
        back_populates="sent_po_email_logs",
    )