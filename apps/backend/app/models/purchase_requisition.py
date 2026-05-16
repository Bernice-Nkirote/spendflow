import uuid

from sqlalchemy import (
    Boolean,
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
from app.models.enums import PRStatusEnum, pr_status_enum


class PurchaseRequisition(Base):
    __tablename__ = "purchase_requisitions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    pr_number = Column(String, nullable=False)

    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    requested_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    total_amount = Column(Numeric(14, 2), nullable=False)

    currency = Column(String, nullable=False, default="KES")

    exchange_rate = Column(Numeric(18, 6), nullable=True)

    base_currency = Column(String(3), nullable=True)

    base_amount = Column(Numeric(14, 2), nullable=True)

    exchange_rate_date = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    status = Column(
        pr_status_enum,
        nullable=False,
        default=PRStatusEnum.DRAFT,
        server_default=PRStatusEnum.DRAFT.value,
        index=True,
    )

    is_active = Column(Boolean, nullable=False, default=True)

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
        UniqueConstraint("company_id", "pr_number", name="uq_pr_company_pr_number"),
        Index("ix_pr_company_id_pr_number", "company_id", "pr_number"),
        Index("ix_pr_company_id_status", "company_id", "status"),
        Index("ix_pr_company_id_department_id", "company_id", "department_id"),
        Index("ix_pr_company_id_requested_by", "company_id", "requested_by"),
    )

    company = relationship("Company", back_populates="requisitions")
    department = relationship("Department", back_populates="requisitions")
    requester = relationship("User", back_populates="requisitions")
    items = relationship(
        "PurchaseRequisitionItem",
        back_populates="requisition",
        cascade="all, delete-orphan",
    )
    purchase_orders = relationship("PurchaseOrder", back_populates="purchase_requisition")