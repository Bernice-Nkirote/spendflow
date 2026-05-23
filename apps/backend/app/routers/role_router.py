from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_admin_user
from app.core.database import get_db
from app.repositories.role_repository import RoleRepository
from app.schemas.role_schemas import (
    PaginatedRoleResponse,
    RoleCreate,
    RoleRead,
    RoleUpdate,
)
from app.services.roles_service import RoleService


router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
    dependencies=[Depends(get_current_admin_user)],
)


def get_role_service(db: Session = Depends(get_db)) -> RoleService:
    repo = RoleRepository(db)
    return RoleService(repo)


@router.post("/", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    role_data: RoleCreate,
    service: RoleService = Depends(get_role_service),
    current_user=Depends(get_current_admin_user),
):
    return service.create_role(role_data, current_user.company_id)


@router.get("/", response_model=list[RoleRead])
def get_all_roles(
    service: RoleService = Depends(get_role_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_all_roles(current_user.company_id)

@router.get("/paginated", response_model=PaginatedRoleResponse)
def get_paginated_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    service: RoleService = Depends(get_role_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_paginated_roles(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )

@router.get("/{role_id}", response_model=RoleRead)
def get_role(
    role_id: UUID,
    service: RoleService = Depends(get_role_service),
    current_user=Depends(get_current_admin_user),
):
    return service.get_role(role_id, current_user.company_id)


@router.put("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: UUID,
    role_data: RoleUpdate,
    service: RoleService = Depends(get_role_service),
    current_user=Depends(get_current_admin_user),
):
    return service.update_role(role_id, role_data, current_user.company_id)


@router.patch("/{role_id}/activate", response_model=RoleRead)
def activate_role(
    role_id: UUID,
    service: RoleService = Depends(get_role_service),
    current_user=Depends(get_current_admin_user),
):
    return service.activate_role(role_id, current_user.company_id)


@router.patch("/{role_id}/deactivate", response_model=RoleRead)
def deactivate_role(
    role_id: UUID,
    service: RoleService = Depends(get_role_service),
    current_user=Depends(get_current_admin_user),
):
    return service.deactivate_role(
    role_id=role_id,
    company_id=current_user.company_id,
    current_user_role_id=current_user.role_id,
)

@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: UUID,
    service: RoleService = Depends(get_role_service),
    current_user=Depends(get_current_admin_user),
):
    service.delete_role(role_id, current_user.company_id)
    return None