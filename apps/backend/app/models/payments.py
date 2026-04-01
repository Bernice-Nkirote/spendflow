import uuid
from sqlalchemy import Column, ForeignKey, Numeric, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.enums import(
    PaymentMethodEnum,
    payment_method_enum,
    PaymentStatusEnum,
    payment_status_enum
)

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    amount = Column(Numeric(12,2), nullable=False)
    payment_method = Column(
        payment_method_enum,
        nullable=False
        )
    
    status = Column(
        payment_status_enum,
        nullable=False,
        default=PaymentStatusEnum.COMPLETED,
        server_default=PaymentStatusEnum.COMPLETED.value
    )

    reference = Column(String, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    paid_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
    user = relationship("User")

