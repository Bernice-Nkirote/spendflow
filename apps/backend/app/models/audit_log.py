import uuid
from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base

class AuditLog(Base):
    __tablename__= "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Entity being tracked PO, Invoice, Payments
    entity = Column(String, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)

    # Action performed (CREATE, UPDATE, DELETED,PAY)
    action = Column(String, nullable=False)

    # Who performed the action
    user_id = Column(UUID(as_uuid=True), nullable=True)

    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)

    # When the action happened
    timestamp = Column(DateTime(timezone=True), server_default=func.now())



