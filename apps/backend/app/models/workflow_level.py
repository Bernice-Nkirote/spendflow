import uuid
from datetime import datetime
from sqlalchemy import Index, Column, String, Boolean,Integer, Numeric, ForeignKey,DateTime,JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import UniqueConstraint
from app.core.database import Base

class WorkflowLevel(Base):
    __tablename__="workflow_levels"

    id = Column(UUID(as_uuid=True),primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True),
                         ForeignKey("approval_workflows.id"),
                         nullable=False)
    
    # Name of the level e.g manager approval, finance approval
    name = Column(String, nullable=True)
    level_order = Column(Integer, nullable=False)
    min_amount = Column(Numeric(14,2), nullable=True)
    max_amount=Column(Numeric(14,2), nullable=True)

    department_id = Column(UUID(as_uuid=True),
                           ForeignKey("departments.id"),
                           nullable=False)
    condition_expression = Column(JSON,nullable=True)
    created_at = Column(DateTime(timezone=True),server_default=func.now(),nullable=False)
    updated_at = Column(DateTime(timezone=True),server_default=func.now(),onupdate=func.now(),nullable=False)
    
    __table_args__=(
        UniqueConstraint('workflow_id', 'level_order', name='uq_workflow_level_level_order'),
        Index('ix_workflow_levels_workflow_id', 'workflow_id')
    )

# relationship
    workflow= relationship("ApprovalWorkflow", back_populates="levels")
    roles = relationship("WorkflowLevelRole", back_populates="level", cascade="all, delete-orphan")