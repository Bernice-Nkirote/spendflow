from sqlalchemy.orm import Session
from app.models.purchase_order import PurchaseOrder
from uuid import UUID

class PurchaseOrderRepository:
    def __init__(self, db):
        self.db = db

    def create(self, po: PurchaseOrder):
        self.db.add(po)
        self.db.commit()
        self.db.refresh(po)
        return po

    def get_by_id(self, po_id, company_id):
        return (
            self.db.query(PurchaseOrder)
            .filter(PurchaseOrder.id == po_id, PurchaseOrder.company_id == company_id)
            .first()
        )

    def get_all_by_company(self, company_id):
        return (
            self.db.query(PurchaseOrder)
            .filter(PurchaseOrder.company_id == company_id)
            .all()
        )

    def delete(self, po: PurchaseOrder):
        self.db.delete(po)
        self.db.commit()