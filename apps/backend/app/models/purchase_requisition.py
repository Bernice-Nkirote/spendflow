import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime,Numeric, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class PurchaseRequisition(Base):
    __tablename__ = "purchase_requisitions"

    id = Column(UUID(as_uuid=True), primary_key= True, default=uuid.uuid4)
    
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False
    )

    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True
    )

    requested_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    total_amount = Column(Numeric(14,2), nullable= False)
    currency= Column(String, default='KES')

    status = Column(String, default="pending")

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True),server_default=func.now(),nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),nullable=False)


    # Relationships
    company = relationship("Company", back_populates="requisitions")
    department = relationship("Department", back_populates="requisitions")
    requester = relationship("User", back_populates="requisitions")

    items = relationship(
        "PurchaseRequisitionItem",
        back_populates="requisition",
        cascade="all, delete-orphan"
    )