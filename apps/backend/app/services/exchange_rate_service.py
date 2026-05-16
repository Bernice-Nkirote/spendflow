from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException, status

from app.models.exchange_rate import ExchangeRate
from app.repositories.exchange_rate_repository import ExchangeRateRepository
from app.repositories.company_repository import CompanyRepository
from app.schemas.exchange_rate_schema import ExchangeRateCreate, ExchangeRateUpdate


class ExchangeRateService:
    def __init__(
        self,
        repo: ExchangeRateRepository,
        company_repo: CompanyRepository | None = None,
    ):
        self.repo = repo
        self.company_repo = company_repo

    def _normalize_currency(self, currency: str) -> str:
        normalized = currency.strip().upper()

        if len(normalized) != 3:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Currency code must be a 3-letter ISO code",
            )

        return normalized

    def convert_transaction_to_company_base_currency(
        self,
        company_id: UUID,
        amount: Decimal,
        transaction_currency: str,
        as_of_date: date,
    ) -> tuple[Decimal, Decimal, str, date]:
        if self.company_repo is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Company repository is required for company base currency conversion",
            )

        company = self.company_repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found",
            )

        base_currency = self._normalize_currency(company.currency)

        base_amount, exchange_rate, exchange_rate_date = self.convert_to_base_currency(
            company_id=company_id,
            amount=amount,
            from_currency=transaction_currency,
            base_currency=base_currency,
            as_of_date=as_of_date,
        )

        return base_amount, exchange_rate, base_currency, exchange_rate_date

    def create_exchange_rate(
        self,
        data: ExchangeRateCreate,
        company_id: UUID,
        created_by: UUID | None,
    ) -> ExchangeRate:
        from_currency = self._normalize_currency(data.from_currency)
        to_currency = self._normalize_currency(data.to_currency)

        if from_currency == to_currency:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="From currency and to currency cannot be the same",
            )

        existing_rate = self.repo.get_by_currency_pair_and_date(
            company_id=company_id,
            from_currency=from_currency,
            to_currency=to_currency,
            effective_date=data.effective_date,
        )
        if existing_rate:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Exchange rate already exists for this currency pair and effective date",
            )

        exchange_rate = ExchangeRate(
            company_id=company_id,
            from_currency=from_currency,
            to_currency=to_currency,
            rate=data.rate,
            source=data.source or "MANUAL",
            effective_date=data.effective_date,
            created_by=created_by,
        )

        created_rate = self.repo.create(exchange_rate)
        self.repo.db.commit()
        self.repo.db.refresh(created_rate)

        return created_rate

    def get_exchange_rate(
        self,
        exchange_rate_id: UUID,
        company_id: UUID,
    ) -> ExchangeRate:
        exchange_rate = self.repo.get_by_id(exchange_rate_id, company_id)
        if not exchange_rate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange rate not found",
            )

        return exchange_rate

    def get_all_exchange_rates(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ExchangeRate]:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip cannot be negative",
            )

        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        return self.repo.get_all(company_id=company_id, skip=skip, limit=limit)

    def get_latest_exchange_rate(
        self,
        company_id: UUID,
        from_currency: str,
        to_currency: str,
        as_of_date: date,
    ) -> ExchangeRate:
        normalized_from_currency = self._normalize_currency(from_currency)
        normalized_to_currency = self._normalize_currency(to_currency)

        if normalized_from_currency == normalized_to_currency:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use direct base conversion for matching currencies",
            )

        exchange_rate = self.repo.get_latest_rate(
            company_id=company_id,
            from_currency=normalized_from_currency,
            to_currency=normalized_to_currency,
            as_of_date=as_of_date,
        )
        if not exchange_rate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"No exchange rate found for "
                    f"{normalized_from_currency} to {normalized_to_currency} "
                    f"on or before {as_of_date.isoformat()}"
                ),
            )

        return exchange_rate

    def convert_to_base_currency(
        self,
        company_id: UUID,
        amount: Decimal,
        from_currency: str,
        base_currency: str,
        as_of_date: date,
    ) -> tuple[Decimal, Decimal, date]:
        normalized_from_currency = self._normalize_currency(from_currency)
        normalized_base_currency = self._normalize_currency(base_currency)

        if normalized_from_currency == normalized_base_currency:
            return (
                amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP),
                Decimal("1.000000"),
                as_of_date,
            )

        exchange_rate = self.get_latest_exchange_rate(
            company_id=company_id,
            from_currency=normalized_from_currency,
            to_currency=normalized_base_currency,
            as_of_date=as_of_date,
        )

        base_amount = (amount * exchange_rate.rate).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        return base_amount, exchange_rate.rate, exchange_rate.effective_date

    def update_exchange_rate(
        self,
        exchange_rate_id: UUID,
        data: ExchangeRateUpdate,
        company_id: UUID,
    ) -> ExchangeRate:
        exchange_rate = self.get_exchange_rate(exchange_rate_id, company_id)

        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(exchange_rate, field, value)

        updated_rate = self.repo.update(exchange_rate)
        self.repo.db.commit()
        self.repo.db.refresh(updated_rate)

        return updated_rate

    def delete_exchange_rate(
        self,
        exchange_rate_id: UUID,
        company_id: UUID,
    ) -> None:
        exchange_rate = self.get_exchange_rate(exchange_rate_id, company_id)

        self.repo.delete(exchange_rate)
        self.repo.db.commit()