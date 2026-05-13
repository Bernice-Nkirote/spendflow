import uuid
from sqlalchemy import Column, ForeignKey, DateTime, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class WorkflowLevelRole(Base):
    __tablename__ = "workflow_level_roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Company ownership for multi-tenancy
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False
    )
    
    # Workflow level this role is attached to
    level_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflow_levels.id"),
        nullable=False
    )

    # Role allowed to act at this level
    role_id = Column(
        UUID(as_uuid=True),
        ForeignKey("roles.id"),
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
        UniqueConstraint("level_id", "role_id", name="uq_workflow_level_roles"),
        Index("ix_workflow_level_roles_company_id", "company_id"),
        Index("ix_workflow_level_roles_level_id", "level_id"),
        Index("ix_workflow_level_roles_role_id", "role_id"),
    )

    # Relationships
    company = relationship("Company", back_populates="workflow_level_roles")
    role = relationship("Role", back_populates="level_roles")
    level = relationship("WorkflowLevel", back_populates="level_roles")

    @property
    def role_name(self) -> str | None:
        return self.role.name if self.role else None

    @property
    def level_name(self) -> str | None:
        return self.level.name if self.level else None