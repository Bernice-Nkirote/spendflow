# app/routes/purchase_order_item.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.po_items_schema import PurchaseOrderItemCreate, PurchaseOrderItemResponse
from app.services.po_item_service import PurchaseOrderItemService
from app.core.database import get_db
from app.core.auth_dependancy import get_current_user
from uuid import UUID

router = APIRouter(prefix="/po-items", tags=["Purchase Order Items"])

@router.post("/{po_id}", response_model=PurchaseOrderItemResponse)
def create_item(po_id: UUID, item_data: PurchaseOrderItemCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderItemService(db)
    return service.create_item(po_id, item_data)

@router.get("/{po_id}", response_model=list[PurchaseOrderItemResponse])
def get_items(po_id: UUID, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderItemService(db)
    return service.get_items_by_po(po_id)

@router.put("/{item_id}", response_model=PurchaseOrderItemResponse)
def update_item(item_id: UUID, item_data: PurchaseOrderItemCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderItemService(db)
    updated_item = service.update_item(item_id, item_data)
    if not updated_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return updated_item

@router.delete("/{item_id}")
def delete_item(item_id: UUID, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    service = PurchaseOrderItemService(db)
    deleted_item = service.delete_item(item_id)
    if not deleted_item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"message": "Item deleted successfully"}