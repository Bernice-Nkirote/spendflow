import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class EntityTypeEnum(str, enum.Enum):
    PR = "PR"
    PO = "PO"
    INVOICE = "INVOICE"
    PAYMENT = "PAYMENT"

class ApprovalStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ApprovalInstance(Base):
    __tablename__ = "approval_instances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("approval_workflows.id"),nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    entity_type = Column(Enum(EntityTypeEnum), nullable=False)
    current_level_id = Column(UUID(as_uuid=True), ForeignKey("workflow_levels.id"), nullable=True)
    status = Column(Enum(ApprovalStatus), default=ApprovalStatus.PENDING, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    workflow = relationship("ApprovalWorkflow")
    current_level = relationship("WorkflowLevel")
    actions = relationship("ApprovalAction", back_populates="instance", cascade="all, delete-orphan")
    