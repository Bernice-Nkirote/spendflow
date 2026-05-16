from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_admin_user, get_current_user
from app.core.database import get_db
from app.repositories.exchange_rate_repository import ExchangeRateRepository
from app.schemas.exchange_rate_schema import (
    ExchangeRateCreate,
    ExchangeRateRead,
    ExchangeRateUpdate,
)
from app.services.exchange_rate_service import ExchangeRateService


router = APIRouter(
    prefix="/exchange-rates",
    tags=["Exchange Rates"],
)


def get_exchange_rate_service(db: Session = Depends(get_db)) -> ExchangeRateService:
    repo = ExchangeRateRepository(db)
    return ExchangeRateService(repo)


@router.post("/", response_model=ExchangeRateRead, status_code=status.HTTP_201_CREATED)
def create_exchange_rate(
    exchange_rate_data: ExchangeRateCreate,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_admin_user),
):
    return service.create_exchange_rate(
        data=exchange_rate_data,
        company_id=current_user.company_id,
        created_by=current_user.id,
    )


@router.get("/", response_model=list[ExchangeRateRead])
def get_all_exchange_rates(
    skip: int = 0,
    limit: int = 100,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_user),
):
    return service.get_all_exchange_rates(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/latest", response_model=ExchangeRateRead)
def get_latest_exchange_rate(
    from_currency: str,
    to_currency: str,
    as_of_date: date,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_user),
):
    return service.get_latest_exchange_rate(
        company_id=current_user.company_id,
        from_currency=from_currency,
        to_currency=to_currency,
        as_of_date=as_of_date,
    )


@router.get("/{exchange_rate_id}", response_model=ExchangeRateRead)
def get_exchange_rate(
    exchange_rate_id: UUID,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_user),
):
    return service.get_exchange_rate(
        exchange_rate_id=exchange_rate_id,
        company_id=current_user.company_id,
    )


@router.put("/{exchange_rate_id}", response_model=ExchangeRateRead)
def update_exchange_rate(
    exchange_rate_id: UUID,
    exchange_rate_data: ExchangeRateUpdate,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_admin_user),
):
    return service.update_exchange_rate(
        exchange_rate_id=exchange_rate_id,
        data=exchange_rate_data,
        company_id=current_user.company_id,
    )


@router.delete("/{exchange_rate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exchange_rate(
    exchange_rate_id: UUID,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_admin_user),
):
    service.delete_exchange_rate(
        exchange_rate_id=exchange_rate_id,
        company_id=current_user.company_id,
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)