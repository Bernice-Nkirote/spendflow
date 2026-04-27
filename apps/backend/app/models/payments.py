import uuid

from sqlalchemy import Column, DateTime, ForeignKey, Index, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import PaymentStatusEnum, payment_method_enum, payment_status_enum


class Payment(Base):
    __tablename__ = "payments"

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

    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    amount = Column(Numeric(12, 2), nullable=False)

    payment_method = Column(
        payment_method_enum,
        nullable=False,
        index=True,
    )

    status = Column(
        payment_status_enum,
        nullable=False,
        default=PaymentStatusEnum.COMPLETED,
        server_default=PaymentStatusEnum.COMPLETED.value,
        index=True,
    )

    reference = Column(String, nullable=True, index=True)

    paid_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    __table_args__ = (
        Index("ix_payments_company_invoice", "company_id", "invoice_id"),
    )

    company = relationship("Company", back_populates="payments")

    invoice = relationship(
        "Invoice",
        back_populates="payments",
    )

    created_by_user = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="payments_created",
    )