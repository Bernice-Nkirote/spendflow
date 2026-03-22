import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Enum, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.models.enums import action_type_enum

class ApprovalAction(Base):
    __tablename__="approval_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    instance_id = Column(UUID(as_uuid=True), ForeignKey("approval_instances.id"),nullable=False)
    level_id = Column(UUID(as_uuid=True), ForeignKey("workflow_levels.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    # Action whether approved or rejected
    action = Column(action_type_enum, nullable=False)  
    comment = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


#  Unique constraint
    __table_args__ = (
        UniqueConstraint('instance_id', 'level_id', 'user_id', name='uq_user_level_action'),
    )

    # Relationships
    instance = relationship("ApprovalInstance", back_populates="actions")
    level = relationship("WorkflowLevel")
    user = relationship("User", backref="approval_actions")