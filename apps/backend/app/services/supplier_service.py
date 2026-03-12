import uuid
from sqlalchemy.orm import Session
from app.repositories.supplier_repository import SupplierRepository
from app.models.supplier import Supplier

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
    
    
    def get_supplier(self, db: Session, supplier_id: uuid.UUID):
        return self.repo.get_by_id(db, supplier_id)


    def list_suppliers(self, db:Session):
        return self.repo.get_all(db)
   