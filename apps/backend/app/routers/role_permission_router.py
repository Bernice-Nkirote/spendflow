from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth_dependancy import get_current_admin_user
from app.models.user import User
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.schemas.role_permission_schema import (
    RolePermissionCreate,
    RolePermissionRead,
)
from app.services.permission_service import PermissionService


router = APIRouter(
    tags=["Role Permissions"],
    dependencies=[Depends(get_current_admin_user)],
)


def get_permission_service(db: Session = Depends(get_db)) -> PermissionService:
    return PermissionService(
        permission_repo=PermissionRepository(db),
        role_permission_repo=RolePermissionRepository(db),
        role_repo=RoleRepository(db),
    )


@router.post("/role-permissions", response_model=RolePermissionRead)
def assign_permission_to_role(
    data: RolePermissionCreate,
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    return service.assign_permission_to_role(
        data=data,
        company_id=current_user.company_id,
    )


@router.get(
    "/roles/{role_id}/permissions",
    response_model=list[RolePermissionRead],
)
def get_permissions_for_role(
    role_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    return service.get_permissions_for_role(
        role_id=role_id,
        company_id=current_user.company_id,
    )

@router.delete(
    "/role-permissions/{role_permission_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_permission_from_role(
    role_permission_id: UUID,
    current_user: User = Depends(get_current_admin_user),
    service: PermissionService = Depends(get_permission_service),
):
    service.remove_permission_from_role(
        role_permission_id=role_permission_id,
        company_id=current_user.company_id,
    )
    return None