import uuid
from sqlalchemy import Column, ForeignKey, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import entity_type_enum, approval_status_enum, ApprovalStatus


class ApprovalInstance(Base):
    __tablename__ = "approval_instances"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    workflow_id = Column(
        UUID(as_uuid=True),
        ForeignKey("approval_workflows.id"),
        nullable=False
    )

    entity_id = Column(UUID(as_uuid=True), nullable=False)
    entity_type = Column(entity_type_enum, nullable=False)

    current_level_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflow_levels.id"),
        nullable=True
    )

    status = Column(
        approval_status_enum,
        nullable=False,
        default=ApprovalStatus.PENDING,
        server_default=ApprovalStatus.PENDING.value
    )

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False
    )

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


    __table_args__ = (
        Index("idx_approval_instances_entity_id", "entity_id"),
        Index("idx_approval_instances_workflow_id", "workflow_id"),
        Index("idx_approval_instances_company_id", "company_id"),
        Index("idx_approval_instances_company_entity", "company_id", "entity_id"),
    )

    # Relationships 
    company = relationship("Company", back_populates="approval_instances")
    workflow = relationship("ApprovalWorkflow", back_populates="instances")
    current_level = relationship("WorkflowLevel", back_populates="instances")
    actions = relationship(
        "ApprovalAction",
        back_populates="instance",
        cascade="all, delete-orphan"
    )