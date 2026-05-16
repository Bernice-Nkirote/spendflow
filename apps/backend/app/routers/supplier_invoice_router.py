from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.auth_dependancy import get_current_supplier
from app.models.enums import InvoiceStatusEnum
from app.core.database import get_db
from app.repositories.supplier_repository import SupplierRepository
from app.routers.invoice_router import get_invoice_service
from app.schemas.invoice_line_item_schema import (
    InvoiceLineItemCreate,
    InvoiceLineItemRead,
    InvoiceLineItemUpdate,
)
from app.schemas.invoice_schema import (
    InvoiceCreate,
    InvoiceDetailRead,
    InvoiceRead,
    InvoiceUpdate,
)
from app.services.invoice_service import InvoiceService

router = APIRouter(prefix="/supplier/invoices", tags=["Supplier Invoices"])


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


def _ensure_supplier_owns_invoice(
    invoice_id: UUID,
    current_supplier,
    supplier_repo: SupplierRepository,
    service: InvoiceService,
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    invoice = service.get_invoice(
        invoice_id=invoice_id,
        company_id=company_id,
    )

    if invoice.supplier_id != current_supplier.supplier_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot access another supplier's invoice",
        )

    return invoice


@router.post(
    "/",
    response_model=InvoiceRead,
    status_code=status.HTTP_201_CREATED,
)
def create_supplier_invoice(
    invoice_data: InvoiceCreate,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    return service.create_invoice(
        invoice_data=invoice_data,
        company_id=company_id,
        submitting_user=current_supplier,
    )


@router.get("/", response_model=list[InvoiceDetailRead])
def get_all_supplier_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1),
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    return service.get_all_invoices_by_supplier(
        supplier_id=current_supplier.supplier_id,
        company_id=company_id,
        skip=skip,
        limit=limit,
    )


@router.get("/{invoice_id}", response_model=InvoiceDetailRead)
def get_supplier_invoice(
    invoice_id: UUID,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    return _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )


@router.put("/{invoice_id}", response_model=InvoiceRead)
def update_supplier_invoice(
    invoice_id: UUID,
    invoice_data: InvoiceUpdate,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    invoice = _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )

    invoice_status = getattr(invoice.status, "value", str(invoice.status))

    if invoice_status not in {
        InvoiceStatusEnum.DRAFT.value,
        InvoiceStatusEnum.REJECTED.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or rejected invoices can be updated.",
        )

    return service.update_invoice(
        invoice_id=invoice_id,
        invoice_data=invoice_data,
        company_id=company_id,
        actor_supplier_user_id=current_supplier.id,
    )


@router.patch("/{invoice_id}/submit", response_model=InvoiceDetailRead)
def submit_supplier_invoice(
    invoice_id: UUID,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    invoice = _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )

    invoice_status = getattr(invoice.status, "value", str(invoice.status))

    if invoice_status not in {
        InvoiceStatusEnum.DRAFT.value,
        InvoiceStatusEnum.REJECTED.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or rejected invoices can be submitted.",
        )

    return service.submit_invoice(
        invoice_id=invoice_id,
        company_id=company_id,
        actor_supplier_user_id=current_supplier.id,
    )


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_supplier_invoice(
    invoice_id: UUID,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    invoice = _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )

    invoice_status = getattr(invoice.status, "value", str(invoice.status))

    if invoice_status not in {
        InvoiceStatusEnum.DRAFT.value,
        InvoiceStatusEnum.REJECTED.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or rejected invoices can be deleted.",
        )

    service.delete_invoice(
        invoice_id=invoice_id,
        company_id=company_id,
        actor_supplier_user_id=current_supplier.id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/{invoice_id}/items",
    response_model=InvoiceLineItemRead,
    status_code=status.HTTP_201_CREATED,
)
def create_supplier_invoice_line_item(
    invoice_id: UUID,
    item_data: InvoiceLineItemCreate,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    invoice = _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )

    invoice_status = getattr(invoice.status, "value", str(invoice.status))

    if invoice_status not in {
        InvoiceStatusEnum.DRAFT.value,
        InvoiceStatusEnum.REJECTED.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or rejected invoice line items can be changed.",
        )
    return service.create_invoice_line_item(
        invoice_id=invoice_id,
        item_data=item_data,
        company_id=company_id,
    )


@router.get(
    "/{invoice_id}/items",
    response_model=list[InvoiceLineItemRead],
)
def get_all_supplier_invoice_line_items(
    invoice_id: UUID,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )

    return service.get_all_invoice_line_items(
        invoice_id=invoice_id,
        company_id=company_id,
    )


@router.put(
    "/{invoice_id}/items/{item_id}",
    response_model=InvoiceLineItemRead,
)
def update_supplier_invoice_line_item(
    invoice_id: UUID,
    item_id: UUID,
    item_data: InvoiceLineItemUpdate,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    invoice = _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )

    invoice_status = getattr(invoice.status, "value", str(invoice.status))

    if invoice_status not in {
        InvoiceStatusEnum.DRAFT.value,
        InvoiceStatusEnum.REJECTED.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or rejected invoice line items can be changed.",
        )

    return service.update_invoice_line_item(
        item_id=item_id,
        item_data=item_data,
        company_id=company_id,
    )


@router.delete(
    "/{invoice_id}/items/{item_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_supplier_invoice_line_item(
    invoice_id: UUID,
    item_id: UUID,
    current_supplier=Depends(get_current_supplier),
    supplier_repo: SupplierRepository = Depends(get_supplier_repo),
    service: InvoiceService = Depends(get_invoice_service),
):
    company_id = _get_supplier_company_id(
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
    )

    invoice = _ensure_supplier_owns_invoice(
        invoice_id=invoice_id,
        current_supplier=current_supplier,
        supplier_repo=supplier_repo,
        service=service,
    )

    invoice_status = getattr(invoice.status, "value", str(invoice.status))

    if invoice_status not in {
        InvoiceStatusEnum.DRAFT.value,
        InvoiceStatusEnum.REJECTED.value,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only draft or rejected invoice line items can be changed.",
        )

    service.delete_invoice_line_item(
        item_id=item_id,
        company_id=company_id,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)