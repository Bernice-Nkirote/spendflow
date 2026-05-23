from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependancy import get_current_admin_user
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.audit_log_schema import PaginatedAuditLogResponse, AuditLogRead
from app.services.audit_log_service import AuditLogService


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


def get_audit_log_service(db: Session = Depends(get_db)) -> AuditLogService:
    repo = AuditLogRepository(db)
    return AuditLogService(repo)


@router.get("/", response_model=list[AuditLogRead])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_admin_user),
    service: AuditLogService = Depends(get_audit_log_service),
):
    return service.get_audit_logs(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/paginated", response_model=PaginatedAuditLogResponse)
def get_paginated_audit_logs(
    entity_type: str | None = None,
    entity_id: UUID | None = None,
    action: str | None = None,
    actor_user_id: UUID | None = None,
    actor_supplier_user_id: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_admin_user),
    service: AuditLogService = Depends(get_audit_log_service),
):
    return service.search_paginated_audit_logs(
        company_id=current_user.company_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor_user_id=actor_user_id,
        actor_supplier_user_id=actor_supplier_user_id,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )

@router.get("/search", response_model=list[AuditLogRead])
def search_audit_logs(
    entity_type: str | None = None,
    entity_id: UUID | None = None,
    action: str | None = None,
    actor_user_id: UUID | None = None,
    actor_supplier_user_id: UUID | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_admin_user),
    service: AuditLogService = Depends(get_audit_log_service),
):
    return service.search_audit_logs(
        company_id=current_user.company_id,
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        actor_user_id=actor_user_id,
        actor_supplier_user_id=actor_supplier_user_id,
        date_from=date_from,
        date_to=date_to,
        skip=skip,
        limit=limit,
    )

@router.get("/entity/{entity_type}/{entity_id}", response_model=list[AuditLogRead])
def get_entity_audit_logs(
    entity_type: str,
    entity_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_admin_user),
    service: AuditLogService = Depends(get_audit_log_service),
):
    return service.get_entity_logs(
        company_id=current_user.company_id,
        entity_type=entity_type,
        entity_id=entity_id,
        skip=skip,
        limit=limit,
    )

@router.get("/actor-users/{actor_user_id}", response_model=list[AuditLogRead])
def get_actor_user_audit_logs(
    actor_user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_admin_user),
    service: AuditLogService = Depends(get_audit_log_service),
):
    return service.get_actor_user_logs(
        company_id=current_user.company_id,
        actor_user_id=actor_user_id,
        skip=skip,
        limit=limit,
    )

@router.get("/actor-supplier-users/{actor_supplier_user_id}", response_model=list[AuditLogRead])
def get_actor_supplier_user_audit_logs(
    actor_supplier_user_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_admin_user),
    service: AuditLogService = Depends(get_audit_log_service),
):
    return service.get_actor_supplier_user_logs(
        company_id=current_user.company_id,
        actor_supplier_user_id=actor_supplier_user_id,
        skip=skip,
        limit=limit,
    )

@router.get("/{log_id}", response_model=AuditLogRead)
def get_audit_log(
    log_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    service: AuditLogService = Depends(get_audit_log_service),
):
    return service.get_audit_log(
        log_id=log_id,
        company_id=current_user.company_id,
    )