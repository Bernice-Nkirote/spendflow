from datetime import date
from decimal import Decimal, ROUND_HALF_UP
import json
from urllib.error import HTTPError, URLError
from urllib.request import urlopen
from uuid import UUID

from fastapi import HTTPException, status

from app.core.config import settings
from app.models.exchange_rate import ExchangeRate
from app.repositories.company_repository import CompanyRepository
from app.repositories.exchange_rate_repository import ExchangeRateRepository
from app.schemas.exchange_rate_schema import (
    ExchangeRateCreate,
    ExchangeRateSyncRequest,
    ExchangeRateSyncResponse,
    ExchangeRateUpdate,
)


class ExchangeRateService:
    def __init__(
        self,
        repo: ExchangeRateRepository,
        company_repo: CompanyRepository | None = None,
        permission_service=None,
    ):
        self.repo = repo
        self.company_repo = company_repo
        self.permission_service = permission_service

    def _require_permission(
        self,
        role_id: UUID,
        company_id: UUID,
        permission_name: str,
        error_message: str,
    ) -> None:
        if self.permission_service is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Permission service is required.",
            )

        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name=permission_name,
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=error_message,
            )

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
        actor_role_id: UUID,
    ) -> ExchangeRate:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="exchange_rates.create",
            error_message="You do not have permission to create exchange rates.",
        )

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
        actor_role_id: UUID,
    ) -> ExchangeRate:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="exchange_rates.view",
            error_message="You do not have permission to view exchange rates.",
        )

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
        actor_role_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ExchangeRate]:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="exchange_rates.view",
            error_message="You do not have permission to view exchange rates.",
        )

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

    def get_paginated_exchange_rates(
        self,
        company_id: UUID,
        actor_role_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> dict:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="exchange_rates.view",
            error_message="You do not have permission to view exchange rates.",
        )

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

        exchange_rates = self.repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        total_count = self.repo.count_all(company_id)

        return {
            "rows": exchange_rates,
            "total_count": total_count,
        }

    def get_latest_exchange_rate(
        self,
        company_id: UUID,
        from_currency: str,
        to_currency: str,
        as_of_date: date,
        actor_role_id: UUID | None = None,
    ) -> ExchangeRate:
        if actor_role_id is not None:
            self._require_permission(
                role_id=actor_role_id,
                company_id=company_id,
                permission_name="exchange_rates.view",
                error_message="You do not have permission to view exchange rates.",
            )

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
        actor_role_id: UUID,
    ) -> ExchangeRate:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="exchange_rates.update",
            error_message="You do not have permission to update exchange rates.",
        )

        exchange_rate = self.repo.get_by_id(exchange_rate_id, company_id)

        if not exchange_rate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange rate not found",
            )

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
        actor_role_id: UUID,
    ) -> None:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="exchange_rates.delete",
            error_message="You do not have permission to delete exchange rates.",
        )

        exchange_rate = self.repo.get_by_id(exchange_rate_id, company_id)

        if not exchange_rate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Exchange rate not found",
            )

        self.repo.delete(exchange_rate)
        self.repo.db.commit()

    def sync_today_exchange_rates(
        self,
        data: ExchangeRateSyncRequest,
        company_id: UUID,
        actor_role_id: UUID,
        created_by: UUID | None,
    ) -> ExchangeRateSyncResponse:
        self._require_permission(
            role_id=actor_role_id,
            company_id=company_id,
            permission_name="exchange_rates.create",
            error_message="You do not have permission to sync exchange rates.",
        )

        if self.company_repo is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Company repository is required for exchange rate sync.",
            )

        company = self.company_repo.get_by_id(company_id)
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found.",
            )

        provider = settings.EXCHANGE_RATE_PROVIDER.strip().upper()
        base_currency = self._normalize_currency(company.currency)
        effective_date = data.effective_date or date.today()
        from_currencies = data.from_currencies

        if not from_currencies:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Choose at least one currency to sync.",
            )

        provider_rates = self._fetch_provider_rates(base_currency=base_currency)

        created_count = 0
        updated_count = 0
        skipped_currencies: list[str] = []
        failed_currencies: list[str] = []
        synced_rates: list[ExchangeRate] = []

        for from_currency in from_currencies:
            normalized_from_currency = self._normalize_currency(from_currency)

            if normalized_from_currency == base_currency:
                skipped_currencies.append(normalized_from_currency)
                continue

            provider_rate = provider_rates.get(normalized_from_currency)
            if provider_rate is None or provider_rate <= 0:
                failed_currencies.append(normalized_from_currency)
                continue

            # Provider returns base -> currency. Tendaflow stores currency -> base.
            rate_to_base = (Decimal("1") / provider_rate).quantize(
                Decimal("0.000001"),
                rounding=ROUND_HALF_UP,
            )

            existing_rate = self.repo.get_by_currency_pair_and_date(
                company_id=company_id,
                from_currency=normalized_from_currency,
                to_currency=base_currency,
                effective_date=effective_date,
            )

            if existing_rate and not data.overwrite_existing:
                skipped_currencies.append(normalized_from_currency)
                continue

            if existing_rate:
                existing_rate.rate = rate_to_base
                existing_rate.source = provider
                synced_rate = self.repo.update(existing_rate)
                updated_count += 1
            else:
                exchange_rate = ExchangeRate(
                    company_id=company_id,
                    from_currency=normalized_from_currency,
                    to_currency=base_currency,
                    rate=rate_to_base,
                    source=provider,
                    effective_date=effective_date,
                    created_by=created_by,
                )
                synced_rate = self.repo.create(exchange_rate)
                created_count += 1

            synced_rates.append(synced_rate)

        self.repo.db.commit()
        for synced_rate in synced_rates:
            self.repo.db.refresh(synced_rate)

        return ExchangeRateSyncResponse(
            provider=provider,
            base_currency=base_currency,
            effective_date=effective_date,
            created_count=created_count,
            updated_count=updated_count,
            skipped_count=len(skipped_currencies),
            failed_count=len(failed_currencies),
            synced_rates=synced_rates,
            skipped_currencies=skipped_currencies,
            failed_currencies=failed_currencies,
        )

    def _fetch_provider_rates(self, base_currency: str) -> dict[str, Decimal]:
        provider = settings.EXCHANGE_RATE_PROVIDER.strip().upper()

        if provider != "EXCHANGERATE_API":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unsupported exchange rate provider.",
            )

        if not settings.EXCHANGE_RATE_API_KEY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Exchange rate API key is not configured. Add "
                    "EXCHANGE_RATE_API_KEY to apps/backend/.env and restart "
                    "the backend server."
                ),
            )

        url = (
            "https://v6.exchangerate-api.com/v6/"
            f"{settings.EXCHANGE_RATE_API_KEY}/latest/{base_currency}"
        )

        try:
            with urlopen(url, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Could not fetch exchange rates from the provider.",
            )

        if payload.get("result") != "success":
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Exchange rate provider did not return rates.",
            )

        conversion_rates = payload.get("conversion_rates")
        if not isinstance(conversion_rates, dict):
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="Exchange rate provider response was invalid.",
            )

        rates: dict[str, Decimal] = {}
        for currency, raw_rate in conversion_rates.items():
            try:
                rates[self._normalize_currency(currency)] = Decimal(str(raw_rate))
            except Exception:
                continue

        return rates
