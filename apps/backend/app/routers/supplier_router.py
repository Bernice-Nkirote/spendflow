from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.auth_dependancy import get_current_user

from app.schemas.supplier_schema import SupplierCreate, SupplierResponse
from app.services.supplier_service import SupplierService

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])
service = SupplierService()

@router.post("/", response_model=SupplierResponse)
def create_supplier(
    supplier: SupplierCreate, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
     
    company_id = current_user["company_id"]

    return service.create_supplier(
        db=db,
        company_id=company_id,
        supplier_data=supplier
    )

    # List suppliers logged in company
@router.get("/", response_model=list[SupplierResponse])
def list_suppliers(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
    ):

    company_id = current_user["company_id"]
    return service.list_suppliers(db)
# Get supplier 
@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(
    supplier_id: UUID, 
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
    ):

    company_id = current_user["company_id"]
    return service.get_supplier(db, supplier_id, company_id)
