from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_supplier
from app.core.database import get_db
from app.repositories.supplier_repository import SupplierRepository
from app.routers.payment_router import get_payment_service
from app.schemas.payment_schema import PaymentDetailRead
from app.services.payment_service import PaymentService

router = APIRouter(prefix="/supplier/payments", tags=["Supplier Payments"])


def get_supplier_repo(db: Session = Depends(get_db)) -> SupplierRepository:
    return SupplierRepository(db)


def _get_supplier_company_id(
    current_supplier,
    supplier_repo: SupplierRepository,
):
    supplier = supplier_repo.get_by_id_for_portal(
        supplier_id=current_supplier.supplier_id,
    )

    if not supplier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier profile not found",
        )

    if not supplier.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supplier profile is inactive",
        )

    return supplier.company_id


@router.get("/", response_model=list[PaymentDetailRead])
def get_all_supplier_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: PaymentService = Depends(get_payment_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    return service.get_all_payments_by_supplier(
        supplier_id=current_supplier.supplier_id,
        company_id=company_id,
        skip=skip,
        limit=limit,
    )