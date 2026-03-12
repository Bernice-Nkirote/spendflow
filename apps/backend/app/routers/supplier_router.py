from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.supplier_schema import SupplierCreate, SupplierResponse
from app.services.supplier_service import SupplierService
from uuid import UUID

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])
service = SupplierService()

@router.post("/", response_model=SupplierResponse)
def create_supplier(supplier: SupplierCreate, company_id: UUID, db: Session = Depends(get_db)):
    # Optionally check if company exists
    from app.repositories.company_repository import CompanyRepository
    company_repo = CompanyRepository()
    company = company_repo.get_by_id(db, company_id)
    if not company:
        raise HTTPException(status_code=400, detail="Company does not exist")
    return service.create_supplier(db, company_id=company_id, supplier_data=supplier)


@router.get("/", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db)):
    return service.list_suppliers(db)

@router.get("/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: UUID, db: Session = Depends(get_db)):
    return service.get_supplier(db, supplier_id)
