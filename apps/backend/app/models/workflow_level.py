import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean,Integer, Numeric, ForeignKey,DateTime,JSON
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
        UniqueConstraint('workflow_id', 'level_order', name='uq_workflow_level-level_order'),
    )

# relationship
    workflow= relationship("ApprovalWorkflow", back_populates="level")
    roles = relationship("WorkflowLevelRole", back_populates="level", cascade="all, delete-orphan")