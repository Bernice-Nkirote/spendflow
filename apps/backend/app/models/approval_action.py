import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import action_type_enum


class ApprovalAction(Base):
    __tablename__ = "approval_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Company ownership for multi-tenancy
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False
    )

    # Approval instance this action belongs to
    instance_id = Column(
        UUID(as_uuid=True),
        ForeignKey("approval_instances.id"),
        nullable=False
    )

    # Workflow level where this action was taken
    level_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflow_levels.id"),
        nullable=False
    )

    # User who performed the action
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    # APPROVED or REJECTED
    action = Column(action_type_enum, nullable=False)

    # Optional comment by the approver
    comment = Column(String, nullable=True)

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
        UniqueConstraint(
            "instance_id",
            "level_id",
            "user_id",
            name="uq_user_level_action"
        ),
        Index("ix_approval_actions_company_id", "company_id"),
        Index("ix_approval_actions_instance_id", "instance_id"),
        Index("ix_approval_actions_level_id", "level_id"),
        Index("ix_approval_actions_user_id", "user_id"),
    )

    # Relationships
    company = relationship("Company", back_populates="approval_actions")
    instance = relationship("ApprovalInstance", back_populates="actions")
    level = relationship("WorkflowLevel",back_populates="approval_actions")
    user = relationship("User", back_populates="approval_actions")