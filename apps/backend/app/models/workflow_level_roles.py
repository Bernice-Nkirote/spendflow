import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean,Integer, Numeric, ForeignKey,DateTime,JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import UniqueConstraint
from app.core.database import Base

class WorkFlowLevelRole(Base):
    __tablename__ = "workflow_level_roles"

    id = Column(UUID(as_uuid=True),primary_key=True,default=uuid.uuid4)

    level_id = Column(UUID(as_uuid=True),
                    ForeignKey("workflow_levels.id"),
                    nullable=False)
    role_id = Column(UUID(as_uuid=True),
                     ForeignKey("roles.id"),
                     nullable=False)
    
    __table_args__=(
        UniqueConstraint('level_id', 'role_id', name='uq_workflow_level_roles'),
    )

    # Relationships
    level = relationship("WorkflowLevel", back_populates="roles")
    role = relationship("Role")