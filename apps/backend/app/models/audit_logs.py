import uuid

from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    entity_type = Column(String, nullable=False, index=True)
    entity_id = Column(UUID(as_uuid=True), nullable=False, index=True)

    action = Column(String, nullable=False, index=True)

    actor_user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    actor_supplier_user_id = Column(UUID(as_uuid=True), nullable=True, index=True)

    description = Column(String, nullable=True)

    details_json = Column(JSON, nullable=True)
    old_values_json = Column(JSON, nullable=True)
    new_values_json = Column(JSON, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_audit_logs_company_entity", "company_id", "entity_type", "entity_id"),
        Index("ix_audit_logs_company_action", "company_id", "action"),
        Index("ix_audit_logs_company_created_at", "company_id", "created_at"),
    )