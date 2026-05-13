import uuid
from sqlalchemy import Column, String, Integer, Numeric, ForeignKey, DateTime, JSON, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class WorkflowLevel(Base):
    __tablename__ = "workflow_levels"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    workflow_id = Column(
        UUID(as_uuid=True),
        ForeignKey("approval_workflows.id"),
        nullable=False
    )

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False
    )
    
    # Name of the level e.g. Manager Approval, Finance Approval
    name = Column(String, nullable=True)

    level_order = Column(Integer, nullable=False)

    min_amount = Column(Numeric(14, 2), nullable=True)
    max_amount = Column(Numeric(14, 2), nullable=True)

    department_id = Column(
        UUID(as_uuid=True),
        ForeignKey("departments.id"),
        nullable=False
    )

    condition_expression = Column(JSON, nullable=True)

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
        UniqueConstraint("workflow_id", "level_order", name="uq_workflow_level_level_order"),
        Index("ix_workflow_levels_workflow_id", "workflow_id"),
        Index("ix_workflow_levels_company_id", "company_id"),
        Index("ix_workflow_levels_department_id", "department_id"),
        Index("ix_workflow_levels_workflow_level_order", "workflow_id", "level_order"),
    )


    # Relationships
    company = relationship("Company", back_populates="workflow_levels")
    workflow = relationship("ApprovalWorkflow", back_populates="levels")
    department = relationship("Department")
    level_roles = relationship(
        "WorkflowLevelRole",
        back_populates="level",
        cascade="all, delete-orphan"
    )
    instances = relationship("ApprovalInstance", back_populates="current_level")
    approval_actions = relationship("ApprovalAction", back_populates="level")
    
    @property
    def workflow_name(self) -> str | None:
        return self.workflow.name if self.workflow else None

    @property
    def department_name(self) -> str | None:
        return self.department.name if self.department else None