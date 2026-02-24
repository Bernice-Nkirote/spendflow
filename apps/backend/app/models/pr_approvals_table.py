import uuid
from datetime import datetime
from sqlalchemy import Column, String,Integer, Boolean, Numeric, ForeignKey,DateTime, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class PRApproval(Base):
    __tablename__="pr_approvals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pr_id = Column(UUID(as_uuid=True), ForeignKey("purchase_requisitions.id"),nullable=False)
    
    level_order = Column(Integer, nullable=False)
    role_required = Column(String, nullable=False)

    status = Column(String, nullable=False, default="PENDING")

    acted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    acted_at = Column(DateTime(timezone=True), nullable=True)

    comment = Column(Text, nullable= True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
