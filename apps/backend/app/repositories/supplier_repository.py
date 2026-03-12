import uuid
from sqlalchemy.orm import Session
from app.models.supplier import Supplier

class SupplierRepository:
    model = Supplier

    def get_by_id(self, db: Session,supplier_id: uuid.UUID):
        return db.query(Supplier).filter(Supplier.id == supplier_id).first()
    
    def create(self, db: Session, supplier: Supplier):
        db.add(supplier)
        db.commit()
        db.refresh(supplier)
        return supplier
    
    def list_all(Self, db: Session):
        return db.query(Supplier).all()
