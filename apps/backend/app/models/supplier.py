import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, UniqueConstraint
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
        nullable=False,
        index=True,
    )
# This is the supplier company name 
    name = Column(String, nullable=False)

    email = Column(String, nullable=True, index=True)

    phone = Column(String, nullable=True, index=True)

    address = Column(String, nullable=True)
# name of contact person in supplier company
    contact_person = Column(String, nullable=True)

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
        UniqueConstraint("company_id", "name", name="uq_suppliers_company_name"),
        Index("ix_suppliers_company_id_name", "company_id", "name"),
    )

    company = relationship("Company", back_populates="suppliers")
    users = relationship("SupplierUser", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")
    po_email_logs = relationship("POEmailLog", back_populates="supplier")
    invoices = relationship(
    "Invoice",
    foreign_keys="Invoice.supplier_id",
    back_populates="supplier",
)