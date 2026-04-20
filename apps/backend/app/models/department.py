import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String, nullable=False)

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
        UniqueConstraint("company_id", "name", name="uq_departments_company_name"),
        Index("ix_departments_company_id_name", "company_id", "name"),
    )

    company = relationship("Company", back_populates="departments")
    users = relationship("User", back_populates="department")
    requisitions = relationship("PurchaseRequisition", back_populates="department")
    purchase_orders = relationship("PurchaseOrder", back_populates="department")