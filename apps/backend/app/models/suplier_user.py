import uuid
from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime
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
        nullable=False
    )

    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(),nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),nullable=False)

    supplier = relationship("Supplier", back_populates="users")
    invoices_Submitted = relationship("Invoice", back_populates="submitted_by_supplier", foreign_keys="Invoice.submitted_by_supplier_id")