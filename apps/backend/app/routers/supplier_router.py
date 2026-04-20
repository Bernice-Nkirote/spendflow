from uuid import UUID

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_user
from app.core.database import get_db
from app.repositories.supplier_repository import SupplierRepository
from app.schemas.supplier_schema import SupplierCreate, SupplierRead, SupplierUpdate
from app.services.supplier_service import SupplierService


router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


def get_supplier_service(db: Session = Depends(get_db)) -> SupplierService:
    repo = SupplierRepository(db)
    return SupplierService(repo)


@router.post("/", response_model=SupplierRead, status_code=status.HTTP_201_CREATED)
def create_supplier(
    supplier_data: SupplierCreate,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.create_supplier(supplier_data, current_user.company_id)


@router.get("/", response_model=list[SupplierRead])
def get_all_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.get_all_suppliers(
        company_id=current_user.company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{supplier_id}", response_model=SupplierRead)
def get_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.get_supplier(supplier_id, current_user.company_id)


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
    )


@router.patch("/{supplier_id}/activate", response_model=SupplierRead)
def activate_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.activate_supplier(supplier_id, current_user.company_id)


@router.patch("/{supplier_id}/deactivate", response_model=SupplierRead)
def deactivate_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    return service.deactivate_supplier(supplier_id, current_user.company_id)


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier(
    supplier_id: UUID,
    current_user=Depends(get_current_user),
    service: SupplierService = Depends(get_supplier_service),
):
    service.delete_supplier(supplier_id, current_user.company_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)