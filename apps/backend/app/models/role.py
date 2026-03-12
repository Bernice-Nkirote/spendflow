import uuid
from sqlalchemy import Column, String,Integer, Boolean, Numeric, ForeignKey,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import UniqueConstraint
from app.core.database import Base

class Role(Base):
    __tablename__="roles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False
    )
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)

    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ =(
        UniqueConstraint('company_id', 'name', name='uq_company_role_name'),
    )