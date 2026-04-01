from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.schemas.invoice_schema import InvoiceCreate, InvoiceRead
from app.services.invoice_services import InvoiceService
from app.repositories.invoice_repository import InvoiceRepository, InvoiceLineItemRepository
from app.core.auth_dependancy import get_current_user

router = APIRouter(prefix="/invoices", tags=["Invoices"])

# Create Invoice
@router.post("/po/{po_id}", response_model=InvoiceRead)
def create_invoice(
    po_id: UUID,
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    invoice_repo = InvoiceRepository(db)
    line_item_repo = InvoiceLineItemRepository(db)

    service = InvoiceService(invoice_repo, line_item_repo, db)

    invoice = service.create_invoice(po_id, current_user, invoice_data)
    return invoice

# List Invoice by PO
@router.get("/po/{po_id}", response_model=List[InvoiceRead])
def list_invoices_by_po(
    po_id: UUID,
    db: Session = Depends(get_db)
):
    invoice_repo = InvoiceRepository(db)
    return invoice_repo.list_by_po(po_id)

# List Invoices by supplier
@router.get("/supplier/{supplier_id}", response_model=List[InvoiceRead])
def list_invoices_by_supplier(
    supplier_id: UUID,
    db: Session = Depends(get_db)
):
    invoice_repo = InvoiceRepository(db)
    return invoice_repo.list_by_supplier(supplier_id)

# Get single invoice
@router.get("/{invoice_id}", response_model=InvoiceRead)
def get_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db)
):
    invoice_repo = InvoiceRepository(db)
    invoice = invoice_repo.get(invoice_id)
    return invoice