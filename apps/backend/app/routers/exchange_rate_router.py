from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.company_repository import CompanyRepository
from app.repositories.exchange_rate_repository import ExchangeRateRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.exchange_rate_schema import (
    ExchangeRateCreate,
    ExchangeRateRead,
    ExchangeRateSyncRequest,
    ExchangeRateSyncResponse,
    ExchangeRateUpdate,
    PaginatedExchangeRateResponse,
)
from app.services.audit_log_service import AuditLogService
from app.services.exchange_rate_service import ExchangeRateService
from app.services.permission_service import PermissionService


router = APIRouter(
    prefix="/exchange-rates",
    tags=["Exchange Rates"],
)


def get_permission_service(db: Session) -> PermissionService:
    audit_log_service = AuditLogService(
        repo=AuditLogRepository(db),
    )

    return PermissionService(
        permission_repo=PermissionRepository(db),
        role_permission_repo=RolePermissionRepository(db),
        role_repo=RoleRepository(db),
        audit_log_service=audit_log_service,
    )


def get_exchange_rate_service(db: Session = Depends(get_db)) -> ExchangeRateService:
    repo = ExchangeRateRepository(db)
    permission_service = get_permission_service(db)

    return ExchangeRateService(
        repo=repo,
        company_repo=CompanyRepository(db),
        permission_service=permission_service,
    )


@router.post("/", response_model=ExchangeRateRead, status_code=status.HTTP_201_CREATED)
def create_exchange_rate(
    exchange_rate_data: ExchangeRateCreate,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_user),
):
    return service.create_exchange_rate(
        data=exchange_rate_data,
        company_id=current_user.company_id,
        created_by=current_user.id,
        actor_role_id=current_user.role_id,
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
        actor_role_id=current_user.role_id,
        skip=skip,
        limit=limit,
    )


@router.get("/paginated", response_model=PaginatedExchangeRateResponse)
def get_paginated_exchange_rates(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1),
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_user),
):
    return service.get_paginated_exchange_rates(
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
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
        actor_role_id=current_user.role_id,
    )


@router.post("/sync-today", response_model=ExchangeRateSyncResponse)
def sync_today_exchange_rates(
    sync_data: ExchangeRateSyncRequest,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_user),
):
    return service.sync_today_exchange_rates(
        data=sync_data,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
        created_by=current_user.id,
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
        actor_role_id=current_user.role_id,
    )


@router.put("/{exchange_rate_id}", response_model=ExchangeRateRead)
def update_exchange_rate(
    exchange_rate_id: UUID,
    exchange_rate_data: ExchangeRateUpdate,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_user),
):
    return service.update_exchange_rate(
        exchange_rate_id=exchange_rate_id,
        data=exchange_rate_data,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )


@router.delete("/{exchange_rate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_exchange_rate(
    exchange_rate_id: UUID,
    service: ExchangeRateService = Depends(get_exchange_rate_service),
    current_user=Depends(get_current_user),
):
    service.delete_exchange_rate(
        exchange_rate_id=exchange_rate_id,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)
