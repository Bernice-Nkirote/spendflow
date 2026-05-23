from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.exchange_rate import ExchangeRate


class ExchangeRateRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, exchange_rate: ExchangeRate) -> ExchangeRate:
        self.db.add(exchange_rate)
        self.db.flush()
        self.db.refresh(exchange_rate)
        return exchange_rate

    def get_by_id(
        self,
        exchange_rate_id: UUID,
        company_id: UUID,
    ) -> Optional[ExchangeRate]:
        return (
            self.db.query(ExchangeRate)
            .filter(
                ExchangeRate.id == exchange_rate_id,
                ExchangeRate.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ExchangeRate]:
        return (
            self.db.query(ExchangeRate)
            .filter(ExchangeRate.company_id == company_id)
            .order_by(ExchangeRate.effective_date.desc(), ExchangeRate.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_all(self, company_id: UUID) -> int:
        return (
            self.db.query(ExchangeRate)
            .filter(ExchangeRate.company_id == company_id)
            .count()
        )

    def get_by_currency_pair_and_date(
        self,
        company_id: UUID,
        from_currency: str,
        to_currency: str,
        effective_date: date,
    ) -> Optional[ExchangeRate]:
        return (
            self.db.query(ExchangeRate)
            .filter(
                ExchangeRate.company_id == company_id,
                ExchangeRate.from_currency == from_currency,
                ExchangeRate.to_currency == to_currency,
                ExchangeRate.effective_date == effective_date,
            )
            .first()
        )

    def get_latest_rate(
        self,
        company_id: UUID,
        from_currency: str,
        to_currency: str,
        as_of_date: date,
    ) -> Optional[ExchangeRate]:
        return (
            self.db.query(ExchangeRate)
            .filter(
                ExchangeRate.company_id == company_id,
                ExchangeRate.from_currency == from_currency,
                ExchangeRate.to_currency == to_currency,
                ExchangeRate.effective_date <= as_of_date,
            )
            .order_by(ExchangeRate.effective_date.desc(), ExchangeRate.created_at.desc())
            .first()
        )

    def update(self, exchange_rate: ExchangeRate) -> ExchangeRate:
        self.db.flush()
        self.db.refresh(exchange_rate)
        return exchange_rate

    def delete(self, exchange_rate: ExchangeRate) -> None:
        self.db.delete(exchange_rate)
        self.db.flush()