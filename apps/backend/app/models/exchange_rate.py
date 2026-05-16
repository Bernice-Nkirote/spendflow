import uuid

from sqlalchemy import Column, Date, DateTime, ForeignKey, Index, Numeric, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id"),
        nullable=False,
        index=True,
    )

    from_currency = Column(String(3), nullable=False)
    to_currency = Column(String(3), nullable=False)

    rate = Column(Numeric(18, 6), nullable=False)

    source = Column(String, nullable=False, default="MANUAL")

    effective_date = Column(Date, nullable=False)

    created_by = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "from_currency",
            "to_currency",
            "effective_date",
            name="uq_exchange_rate_company_currency_date",
        ),
        Index(
            "ix_exchange_rates_company_pair_date",
            "company_id",
            "from_currency",
            "to_currency",
            "effective_date",
        ),
    )

    company = relationship("Company", back_populates="exchange_rates")
    creator = relationship("User")