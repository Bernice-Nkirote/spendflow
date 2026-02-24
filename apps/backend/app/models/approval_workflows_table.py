import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Numeric, ForeignKey,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ApprovalWorkflow(Base):
    __tablename__ = "approval_workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)

    name = Column(String, nullable=False)
    is_active= Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(),onupdate=func.now(),nullable=False)

    rules = relationship("ApprovalWorkflowRule", back_populates="workflow",cascade="all, delete-orphan" )



