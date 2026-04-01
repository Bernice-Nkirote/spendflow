import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False
    )

    name = Column(String, nullable=False)

    email = Column(String, nullable=True)

    phone = Column(String, nullable=True)

    address = Column(String, nullable=True)

    contact_person = Column(String, nullable=True)

    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    users = relationship("SupplierUser", back_populates="supplier")
    invoices_submitted = relationship("Invoice", foreign_keys="Invoice.submitted_by_supplier_id", back_populates="submitted_by_supplier")