import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class SupplierUser(Base):
    __tablename__ = "supplier_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    supplier_id = Column(
        UUID(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    email = Column(String, nullable=False, index=True)
    hashed_password = Column(String, nullable=True)

    password_setup_token = Column(String, nullable=True, index=True)

    password_setup_expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    has_completed_onboarding = Column(Boolean, nullable=False, default=False)

    is_active = Column(Boolean, nullable=False, default=True)

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
        UniqueConstraint("supplier_id", "email", name="uq_supplier_users_supplier_email"),
        Index("ix_supplier_users_supplier_id_email", "supplier_id", "email"),
    )

    supplier = relationship("Supplier", back_populates="users")

    submitted_invoices = relationship(
        "Invoice",
        foreign_keys="Invoice.submitted_by_supplier_user_id",
        back_populates="submitted_by_supplier_user",
    )