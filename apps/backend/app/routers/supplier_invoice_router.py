from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.invoice_schema import InvoiceCreate, InvoiceRead
from app.services.invoice_services import InvoiceService
from app.repositories.invoice_repository import InvoiceRepository, InvoiceLineItemRepository
from app.core.auth_dependancy import get_current_supplier

router = APIRouter(prefix="/supplier/invoices", tags=["Supplier Invoices"])

@router.post("/", response_model=InvoiceRead)
def create_supplier_invoice(
    invoice_data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_supplier=Depends(get_current_supplier)
):
    service = InvoiceService(
        InvoiceRepository(db),
        InvoiceLineItemRepository(db),
        db
    )

    return service.create_invoice(
        po_id=invoice_data.purchase_order_id,
        submitting_user=current_supplier,  # passes supplier user
        invoice_data=invoice_data
    )