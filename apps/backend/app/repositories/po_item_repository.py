from app.models.purchase_order_item import PurchaseOrderItem

class PurchaseOrderItemRepository:
    def __init__(self, db):
        self.db = db

    def get_by_id(self, item_id):
        return self.db.query(PurchaseOrderItem).filter(PurchaseOrderItem.id == item_id).first()

    def get_all_by_po(self, po_id):
        return self.db.query(PurchaseOrderItem).filter(PurchaseOrderItem.purchase_order_id == po_id).all()

    def create(self, item: PurchaseOrderItem):
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(self, item: PurchaseOrderItem):
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: PurchaseOrderItem):
        self.db.delete(item)
        self.db.commit()