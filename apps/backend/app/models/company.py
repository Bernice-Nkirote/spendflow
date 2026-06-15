import uuid
from sqlalchemy import Column, String, Boolean, DateTime, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Company name is kept required and uniquely constrained at table level
    name = Column(String, nullable=False)

    # Lets you disable a company without deleting its data
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    currency = Column(String,nullable=False, default="KES")
    business_type = Column(String, nullable=False, default="company")

    __table_args__ = (
        UniqueConstraint("name", name="uq_companies_name"),
        Index("ix_companies_name", "name"),
    )


    # Relationships
    # Organisational structure
    roles = relationship("Role", back_populates="company")
    departments = relationship("Department", back_populates="company")
    users = relationship("User", back_populates="company")
    suppliers = relationship("Supplier", back_populates="company")
    # Procurement records
    requisitions = relationship("PurchaseRequisition", back_populates="company")
    pr_items = relationship("PurchaseRequisitionItem", back_populates="company")
    purchase_orders = relationship("PurchaseOrder", back_populates="company")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="company")
    # Approval configuration and tracking
    workflow_levels = relationship("WorkflowLevel", back_populates="company")
    workflow_level_roles = relationship("WorkflowLevelRole", back_populates="company")
    workflows = relationship("ApprovalWorkflow", back_populates="company")
    approval_instances = relationship("ApprovalInstance", back_populates="company")
    approval_actions = relationship("ApprovalAction", back_populates="company")
    po_email_logs = relationship("POEmailLog", back_populates="company")
    # Invoices
    invoices = relationship("Invoice", back_populates="company")
    invoice_line_items = relationship(
    "InvoiceLineItem",
    back_populates="company",
)
    # payments
    payments = relationship("Payment", back_populates="company")
    exchange_rates = relationship("ExchangeRate", back_populates="company")
    permissions = relationship("Permission", back_populates="company")

    role_permissions = relationship("RolePermission", back_populates="company") 