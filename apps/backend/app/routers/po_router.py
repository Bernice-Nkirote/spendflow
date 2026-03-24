from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.po_schema import PurchaseOrderCreate, PurchaseOrderResponse
from app.services.po_service import PurchaseOrderService
from app.core.database import get_db
from app.core.auth_dependancy import get_current_user
from fastapi.responses import StreamingResponse
from app.services.po_pdf_service import PurchaseOrderPDFService
from uuid import UUID

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

@router.post("/", response_model=PurchaseOrderResponse)
def create_po(po_data: PurchaseOrderCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderService(db)
    po = service.create_po(po_data, current_user)
    return po

@router.get("/", response_model=list[PurchaseOrderResponse])
def get_all_pos(db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderService(db)
    return service.get_all_pos(current_user["company_id"])

@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_po(po_id: UUID, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderService(db)
    po = service.get_po(po_id, current_user["company_id"])
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    return po

# PDF Download
@router.get("/{po_id}/pdf")
def download_po_pdf(po_id: UUID, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderService(db)
    po = service.get_po(po_id, current_user["company_id"])
    if not po:
        raise HTTPException(status_code=404, detail="Po not found")
    
    pdf_buffer = PurchaseOrderPDFService.generate_pdf(po)
    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={po.po_number}.pdf"})

# APPROVE
@router.post("/{po_id}/approve")
def approve_po(
    po_id: UUID, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = PurchaseOrderService(db)
    po = service.approve_po(po_id, current_user)

    if not po:
        raise HTTPException(status_code=404,detail="Po not found")
    return {"message": f"PO {po.po_numer} approved"}
    
# REJECT
@router.post("/{po_id}/reject")
def reject_po(
    po_id: str, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = PurchaseOrderService(db)

    po = service.reject_po(po_id, current_user)

    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    
    return {"message": f"PO {po.po_number} rejected"}


# PO SEND EMAIL
@router.post("/{po_id}/send")
def send_po(po_id: UUID, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderService(db)

    result = service.send_po_email(po_id, current_user["company_id"])

    if not result:
        raise HTTPException(status_code=404, detail="PO not found")

    return {"message": "PO sent successfully"}