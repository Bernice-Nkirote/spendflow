from uuid import UUID

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.permission_repository import PermissionRepository
from app.repositories.role_permission_repository import RolePermissionRepository
from app.repositories.role_repository import RoleRepository
from app.repositories.supplier_repository import SupplierRepository
from app.schemas.supplier_schema import (
    PaginatedSupplierResponse,
    SupplierCreate,
    SupplierImportResult,
    SupplierRead,
    SupplierUpdate,
)
from app.services.audit_log_service import AuditLogService
from app.services.permission_service import PermissionService
from app.services.supplier_excel_import_service import SupplierExcelImportService
from app.services.supplier_service import SupplierService

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


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


def get_supplier_service(db: Session = Depends(get_db)) -> SupplierService:
    repo = SupplierRepository(db)
    permission_service = get_permission_service(db)

    return SupplierService(
        repo=repo,
        permission_service=permission_service,
    )


def get_supplier_excel_import_service(
    db: Session = Depends(get_db),
) -> SupplierExcelImportService:
    repo = SupplierRepository(db)

    audit_log_service = AuditLogService(
        repo=AuditLogRepository(db),
    )

    permission_service = PermissionService(
        permission_repo=PermissionRepository(db),
        role_permission_repo=RolePermissionRepository(db),
        role_repo=RoleRepository(db),
        audit_log_service=audit_log_service,
    )

    return SupplierExcelImportService(
        repo=repo,
        audit_log_service=audit_log_service,
        permission_service=permission_service,
    )


@router.post("/", response_model=SupplierRead, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier_data: SupplierCreate,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.create_supplier(
        supplier_data=supplier_data,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )


@router.get("/", response_model=list[SupplierRead])
def get_all_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.get_all_suppliers(
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
        skip=skip,
        limit=limit,
    )


@router.post("/import-excel", response_model=SupplierImportResult)
async def import_suppliers_from_excel(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    service: SupplierExcelImportService = Depends(get_supplier_excel_import_service),
):
    return await service.import_suppliers_from_excel(
        file=file,
        company_id=current_user.company_id,
        actor_user_id=current_user.id,
        actor_role_id=current_user.role_id,
    )


@router.get("/paginated", response_model=PaginatedSupplierResponse)
def get_paginated_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.get_paginated_suppliers(
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{supplier_id}", response_model=SupplierRead)
def get_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.get_supplier(
        supplier_id=supplier_id,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )


@router.put("/{supplier_id}", response_model=SupplierRead)
def update_supplier(
    supplier_id: UUID,
    supplier_data: SupplierUpdate,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.update_supplier(
        supplier_id=supplier_id,
        supplier_data=supplier_data,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )


@router.patch("/{supplier_id}/activate", response_model=SupplierRead)
def activate_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.activate_supplier(
        supplier_id=supplier_id,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )


@router.patch("/{supplier_id}/deactivate", response_model=SupplierRead)
def deactivate_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.deactivate_supplier(
        supplier_id=supplier_id,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    service.delete_supplier(
        supplier_id=supplier_id,
        company_id=current_user.company_id,
        actor_role_id=current_user.role_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)