import uuid

from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import InvoiceStatusEnum, invoice_status_enum


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    purchase_order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("purchase_orders.id"),
        nullable=True,
        index=True,
    )

    supplier_id = Column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id"),
        nullable=False,
        index=True,
    )

    submitted_by_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    submitted_by_supplier_user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("supplier_users.id"),
        nullable=True,
        index=True,
    )

    invoice_number = Column(String, nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)

    currency = Column(String(3), nullable=False, server_default="KES")

    exchange_rate = Column(Numeric(18, 6), nullable=True)

    base_currency = Column(String(3), nullable=True)

    base_amount = Column(Numeric(14, 2), nullable=True)

    exchange_rate_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    status = Column(
        invoice_status_enum,
        nullable=False,
        default=InvoiceStatusEnum.DRAFT,
        server_default=InvoiceStatusEnum.DRAFT.value,
        index=True,
    )

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
        CheckConstraint(
            """
            (
                submitted_by_user_id IS NOT NULL
                AND submitted_by_supplier_user_id IS NULL
            )
            OR
            (
                submitted_by_user_id IS NULL
                AND submitted_by_supplier_user_id IS NOT NULL
            )
            """,
            name="ck_invoice_only_one_submitter",
        ),
        UniqueConstraint(
            "company_id",
            "invoice_number",
            name="uq_invoices_company_invoice_number",
        ),
        Index("ix_invoices_company_supplier", "company_id", "supplier_id"),
        Index("ix_invoices_company_po", "company_id", "purchase_order_id"),
    )

    company = relationship("Company", back_populates="invoices")

    purchase_order = relationship(
        "PurchaseOrder",
        back_populates="invoices",
    )

    supplier = relationship(
        "Supplier",
        foreign_keys=[supplier_id],
        back_populates="invoices",
    )

    submitted_by_user = relationship(
        "User",
        foreign_keys=[submitted_by_user_id],
        back_populates="invoices_submitted",
    )

    submitted_by_supplier_user = relationship(
        "SupplierUser",
        foreign_keys=[submitted_by_supplier_user_id],
        back_populates="submitted_invoices",
    )

    line_items = relationship(
        "InvoiceLineItem",
        back_populates="invoice",
        cascade="all, delete-orphan",
    )

    payments = relationship(
        "Payment",
        back_populates="invoice",
    )