from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_supplier
from app.core.database import get_db
from app.repositories.supplier_repository import SupplierRepository
from app.models.enums import POStatusEnum
from app.routers.po_router import get_purchase_order_service
from app.schemas.po_items_schema import PurchaseOrderItemRead
from app.schemas.po_schema import PurchaseOrderDetailRead, PurchaseOrderPaginatedRead
from app.services.po_service import PurchaseOrderService

router = APIRouter(prefix="/supplier/purchase-orders", tags=["Supplier Purchase Orders"])


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


def _ensure_supplier_owns_po(
    po_id: UUID,
    current_supplier,
    supplier_repo: SupplierRepository,
    service: PurchaseOrderService,
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    po = service.get_po(
        po_id=po_id,
        company_id=company_id,
    )

    if po.supplier_id != current_supplier.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access another supplier's purchase order",
        )

    supplier_visible_statuses = {
        POStatusEnum.SENT,
        POStatusEnum.PARTIALLY_RECEIVED,
        POStatusEnum.RECEIVED,
    }

    if po.status not in supplier_visible_statuses:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This purchase order has not been issued to your supplier account",
        )

    return po


@router.get("/", response_model=list[PurchaseOrderDetailRead])
def get_all_supplier_purchase_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    return service.get_visible_pos_by_supplier(
        supplier_id=current_supplier.supplier_id,
        company_id=company_id,
        skip=skip,
        limit=limit,
    )

@router.get("/paginated/list", response_model=PurchaseOrderPaginatedRead)
def get_paginated_supplier_purchase_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    return service.get_visible_pos_by_supplier_paginated(
        supplier_id=current_supplier.supplier_id,
        company_id=company_id,
        skip=skip,
        limit=limit,
    )

@router.get("/{po_id}", response_model=PurchaseOrderDetailRead)
def get_supplier_purchase_order(
    po_id: UUID,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    return _ensure_supplier_owns_po(
        po_id=po_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )


@router.get("/{po_id}/items", response_model=list[PurchaseOrderItemRead])
def get_supplier_purchase_order_items(
    po_id: UUID,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: PurchaseOrderService = Depends(get_purchase_order_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    _ensure_supplier_owns_po(
        po_id=po_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )

    return service.get_all_po_items(
        po_id=po_id,
        company_id=company_id,
    )