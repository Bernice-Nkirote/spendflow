from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependancy import get_current_admin_user
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.audit_log_repository import AuditLogRepository
from app.schemas.permission_schema import (
    PermissionCreate,
    PermissionRead,
    PermissionUpdate,
)
from app.services.permission_service import PermissionService
from app.services.audit_log_service import AuditLogService


router = APIRouter(
    prefix="/permissions",
    tags=["Permissions"],
    dependencies=[Depends(get_current_admin_user)],
)


def get_permission_service(db: Session = Depends(get_db)) -> PermissionService:
    permission_repo=PermissionRepository(db)
    role_permission_repo=RolePermissionRepository(db)
    role_repo=RoleRepository(db)
    audit_log_service=AuditLogService(
        repo=AuditLogRepository(db),
    )
    
    return PermissionService(
       permission_repo=permission_repo,
       role_permission_repo=role_permission_repo,
       role_repo=role_repo,
       audit_log_service=audit_log_service,
    )

@router.post("/", response_model=PermissionRead)
def create_permission(
    data: PermissionCreate,
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    return service.create_permission(
        data=data,
        company_id=current_user.company_id,
        actor_user_id=current_user.id,
    )


@router.get("/", response_model=list[PermissionRead])
def get_permissions(
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    return service.get_permissions(current_user.company_id)


@router.get("/{permission_id}", response_model=PermissionRead)
def get_permission(
    permission_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    return service.get_permission(
        permission_id=permission_id,
        company_id=current_user.company_id,
    )


@router.put("/{permission_id}", response_model=PermissionRead)
def update_permission(
    permission_id: UUID,
    data: PermissionUpdate,
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    return service.update_permission(
        permission_id=permission_id,
        data=data,
        company_id=current_user.company_id,
        actor_user_id=current_user.id,
    )

@router.patch("/{permission_id}/activate", response_model=PermissionRead)
def activate_permission(
    permission_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    return service.activate_permission(
        permission_id=permission_id,
        company_id=current_user.company_id,
        actor_user_id=current_user.id,
    )


@router.patch("/{permission_id}/deactivate", response_model=PermissionRead)
def deactivate_permission(
    permission_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    return service.deactivate_permission(
        permission_id=permission_id,
        company_id=current_user.company_id,
        actor_user_id=current_user.id,
    )