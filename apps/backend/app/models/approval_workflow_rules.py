import uuid
from datetime import datetime
from sqlalchemy import Column, String,Integer, Boolean, Numeric, ForeignKey,DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import UniqueConstraint
from app.core.database import Base

class ApprovalWorkflowRule(Base):
    __tablename__="approval_workflow_rules"

    __table_args__ = (
        UniqueConstraint('workflow_id', 'level_order', name='uq_workflow_level'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("approval_workflows.id"), nullable=False)
    level_order = Column(Integer, nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id"), nullable=False)
    min_amount = Column(Numeric(14,2), nullable=True)
    max_amount = Column(Numeric(14,2), nullable=True)

    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"),nullable=False)
    condition_expression = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at =Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    workflow = relationship("ApprovalWorkflow", back_populates="rules")
    role = relationship("Role")