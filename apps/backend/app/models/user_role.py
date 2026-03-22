import uuid
from sqlalchemy import Column,ForeignKey,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.core.database import Base
from sqlalchemy import UniqueConstraint
from sqlalchemy.orm import relationship

class UserRole(Base):
    __tablename__ = "user_roles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, ForeignKey("users.id"))
    role_id = Column(UUID, ForeignKey("roles.id"))

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'role_id', name='uq_user_role'),
    )

    user = relationship("User")
    role=relationship("Role")