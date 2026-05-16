import uuid

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    name = Column(String, nullable=False)

    email = Column(String, nullable=False, index=True)

    phone_number = Column(String, nullable=True)

    hashed_password = Column(String, nullable=False)

    is_active = Column(Boolean, nullable=False, default=True)

    has_completed_onboarding = Column(Boolean, nullable=False, default=False)

    onboarded_at = Column(DateTime(timezone=True), nullable=True)

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
        UniqueConstraint("company_id", "email", name="uq_users_company_email"),
        Index("ix_users_company_id_email", "company_id", "email"),
        Index("ix_users_company_id_department_id", "company_id", "department_id"),
        Index("ix_users_company_id_role_id", "company_id", "role_id"),
    )

    company = relationship("Company", back_populates="users")
    department = relationship("Department", back_populates="users")
    role = relationship("Role", back_populates="users")
    requisitions = relationship("PurchaseRequisition", back_populates="requester")
    created_purchase_orders = relationship(
    "PurchaseOrder",
    foreign_keys="PurchaseOrder.created_by",
    back_populates="creator",
)
    
    sent_po_email_logs = relationship(
    "POEmailLog",
    foreign_keys="POEmailLog.sent_by",
    back_populates="sender",
)

    uploaded_signed_purchase_order_pdfs = relationship(
    "PurchaseOrder",
    foreign_keys="PurchaseOrder.signed_pdf_uploaded_by",
    back_populates="signed_pdf_uploader"
) 
    invoices_submitted = relationship(
        "Invoice",
        foreign_keys="Invoice.submitted_by_user_id",
        back_populates="submitted_by_user",
    )
    payments_created = relationship(
    "Payment",
    foreign_keys="Payment.created_by",
    back_populates="created_by_user",
)
    approval_actions = relationship("ApprovalAction", back_populates="user")

    # Python computed properties that give frontend human readable values.
    @property
    def role_name(self) -> str | None:
        return self.role.name if self.role else None

    @property
    def department_name(self) -> str | None:
        return self.department.name if self.department else None