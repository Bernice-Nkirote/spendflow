import uuid
from sqlalchemy import Column, String, ForeignKey, Numeric, DateTime, Enum, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base
from app.models.enums import InvoiceStateEnum,invoice_status_enum


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    purchase_order_id = Column(UUID(as_uuid=True), ForeignKey("purchase_orders.id"))
    company_id = Column(UUID(as_uuid=True),ForeignKey("companies.id"), nullable=False)
    
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False)
   
    # submiited by user/supplier helps us to see who created the invoice
    submitted_by_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"),nullable=True)
    submitted_by_supplier_id = Column(UUID(as_uuid=True),ForeignKey("suppliers.id"), nullable=True)
   
    invoice_number = Column(String, nullable=False)
    total_amount = Column(Numeric(12,2), nullable=False)

    status = Column(
        invoice_status_enum, 
        nullable=False, 
        default=InvoiceStateEnum.PENDING,
        server_default=InvoiceStateEnum.PENDING.value)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint(
            "(submitted_by_user_id is NOT NULL AND submitted_by_supplier_id is NULL) OR"
            "(submitted_by_user_id is NULL AND submitted_by_supplier IS NOT NULL)",
            name="check_only_one_submitter"
        ),
    )

    # Relationships
    line_items = relationship("InvoiceLineItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", backref="invoice")
    submitted_by_user = relationship("User", foreign_keys=[submitted_by_user_id], backref="invoices_submitted")
    submitted_by_supplier = relationship("Supplier", foreign_keys=[submitted_by_supplier_id], backref="invoices_submitted")