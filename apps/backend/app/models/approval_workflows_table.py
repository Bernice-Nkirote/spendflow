import uuid
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base
from app.models.enums import entity_type_enum


class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Company ownership for multi-tenancy
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False
    )

    # Human-readable workflow name, e.g. "PR Approval Flow"
    name = Column(String, nullable=False)

    # The entity this workflow applies to, e.g. PR, PO, INVOICE, PAYMENT
    entity_type = Column(entity_type_enum, nullable=False)

    # Allows workflows to be activated/deactivated without deletion
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

    __table_args__ = (
        UniqueConstraint("company_id", "name", name="uq_workflow_name_per_company"),
        Index("ix_approval_workflows_company_id", "company_id"),
        Index("ix_approval_workflows_company_entity_type", "company_id", "entity_type"),
    )

    # Relationships
    company = relationship("Company", back_populates="workflows")
    # A workflow contains many ordered levels
    
    levels = relationship(
        "WorkflowLevel",
        back_populates="workflow",
        cascade="all, delete-orphan"
    )

    # A workflow can be used by many approval instances
    instances = relationship(
        "ApprovalInstance",
        back_populates="workflow",
    )