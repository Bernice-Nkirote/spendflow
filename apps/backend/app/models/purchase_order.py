import uuid

from sqlalchemy import (
    Column,
    String,
    ForeignKey,
    DateTime,
    Numeric,
    Text,
    Index,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import POStatusEnum, po_status_enum


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
    )

    po_number = Column(String, nullable=False)

    # Who created the PO
    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    # Who sent PO to approval
    submitted_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    # Who sent it to supplier
    issued_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
    )

    purchase_requisition_id = Column(
        UUID(as_uuid=True),
        ForeignKey("purchase_requisitions.id"),
        nullable=True,
    )

    supplier_id = Column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id"),
        nullable=False,
    )

    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id"),
        nullable=True,
    )

    status = Column(
        po_status_enum,
        nullable=False,
        default=POStatusEnum.DRAFT,
        server_default=POStatusEnum.DRAFT.value,
    )

    total_amount = Column(Numeric(12, 2), nullable=False)

    currency = Column(String, nullable=False, server_default="KES")

    notes = Column(Text, nullable=True)

    submitted_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )
    # who sent it to the supplier
    issued_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

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
        UniqueConstraint("company_id", "po_number", name="uq_po_company_po_number"),
        Index("ix_po_company_id_po_number", "company_id", "po_number"),
        Index("ix_po_company_id_status", "company_id", "status"),
        Index("ix_purchase_orders_company_id", "company_id"),
        Index("ix_purchase_orders_created_by", "created_by"),
        Index("ix_purchase_orders_submitted_by", "submitted_by"),
        Index("ix_purchase_orders_issued_by", "issued_by"),
        Index("ix_purchase_orders_purchase_requisition_id", "purchase_requisition_id"),
        Index("ix_purchase_orders_supplier_id", "supplier_id"),
        Index("ix_purchase_orders_department_id", "department_id"),
    )

    company = relationship("Company", back_populates="purchase_orders")

    creator = relationship(
        "User",
        foreign_keys=[created_by],
        back_populates="created_purchase_orders",
    )

    submitter = relationship(
        "User",
        foreign_keys=[submitted_by],
    )

    issuer = relationship(
        "User",
        foreign_keys=[issued_by],
    )

    purchase_requisition = relationship(
        "PurchaseRequisition",
        back_populates="purchase_orders",
    )


    supplier = relationship("Supplier", back_populates="purchase_orders")

    email_logs = relationship(
    "POEmailLog",
    back_populates="purchase_order",
    cascade="all, delete-orphan",
    )
    
    department = relationship("Department", back_populates="purchase_orders")

    items = relationship(
        "PurchaseOrderItem",
        back_populates="purchase_order",
        cascade="all, delete-orphan",
    )

    invoices = relationship("Invoice", back_populates="purchase_order")