import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Boolean
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
        nullable=False
    )

    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True
    )

    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
        nullable=False
    )

    name = Column(String, nullable=False)
    email= Column(String, nullable=False, unique=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True),server_default=func.now(),nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),nullable=False)
# Relationships
    company = relationship("Company", back_populates="users")
    department = relationship("Department", back_populates="users")
    role = relationship("Role")
    requisitions= relationship("PurchaseRequisition", back_populates="requester")