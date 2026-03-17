from fastapi import HTTPException
import uuid
from sqlalchemy.orm import Session
from app.repositories.supplier_repository import SupplierRepository
from app.models.supplier import Supplier
from uuid import UUID

class SupplierService:

    def __init__(self):
        self.repo = SupplierRepository()
    
    def create_supplier(self, db: Session, company_id: uuid.UUID, supplier_data):
        supplier = Supplier(
            id=uuid.uuid4(),
            company_id=company_id,
            name=supplier_data.name,
            email=supplier_data.email,
            phone=supplier_data.phone,
            address=supplier_data.address,
            contact_person=supplier_data.contact_person,
            is_active=getattr(supplier_data, "is_active", True)
        )
        return self.repo.create(db, supplier)
    
    
    def get_supplier(self, db: Session, supplier_id: UUID, company_id: UUID):

        supplier = self.repo.get_by_id(db, supplier_id)

        if not supplier or supplier.company_id != company_id:
            raise HTTPException(status_code=404, detail="Supplier not found")

        return supplier

    def list_suppliers(self, db:Session, company_id: UUID):
        return self.repo.get_all(db, company_id)
   