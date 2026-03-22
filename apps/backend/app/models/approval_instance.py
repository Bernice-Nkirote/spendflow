import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

from app.models.enums import entity_type_enum, approval_status_enum
from app.models.enums import EntityTypeEnum, ApprovalStatus


class ApprovalInstance(Base):
    __tablename__ = "approval_instances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("approval_workflows.id"),nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    entity_type = Column(entity_type_enum, nullable=False)
    current_level_id = Column(UUID(as_uuid=True), ForeignKey("workflow_levels.id"), nullable=True)
    status = Column(approval_status_enum,
                    nullable=False,
                    default=ApprovalStatus,
                    server_default=ApprovalStatus.PENDING.value)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    workflow = relationship("ApprovalWorkflow")
    current_level = relationship("WorkflowLevel")
    actions = relationship("ApprovalAction", back_populates="instance", cascade="all, delete-orphan")
    