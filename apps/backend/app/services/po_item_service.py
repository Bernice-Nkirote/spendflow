from decimal import Decimal
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.purchase_order import PurchaseOrder
from app.repositories.po_item_repository import PurchaseOrderItemRepository

class PurchaseOrderItemService:
    def __init__(self, db):
        self.db = db
        self.repo = PurchaseOrderItemRepository(db)
    
    # for when you add other items you want total to automatically recalculate
    def _recalculate_po_total(self, po_id):
        items =  self.repo.get_all_by_po(po_id)

        total = Decimal("0.00")
        for item in items:
            total += item.total_price
        
        po = self.db.query(PurchaseOrder).filter(PurchaseOrder.id == po.id).first()
        if po:
            po.total_amount = total
            self.db.commit()


    def create_item(self, po_id, item_data):
        total_price = item_data.quantity * item_data.unit_price
        item = PurchaseOrderItem(
            purchase_order_id=po_id,
            product_name=item_data.product_name,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=total_price
        )
        created_item = self.repo.create(item)

        # Update PO Total
        self._recalculate_po_total(po_id)
        return created_item

    def get_items_by_po(self, po_id):
        return self.repo.get_all_by_po(po_id)

    def update_item(self, item_id, item_data):
        item = self.repo.get_by_id(item_id)
        if not item:
            return None

        item.product_name = item_data.product_name
        item.description = item_data.description
        item.quantity = item_data.quantity
        item.unit_price = item_data.unit_price
        item.total_price = item_data.quantity * item_data.unit_price

        updated_item = self.repo.update(item)

        # Update PO Total
        self._recalculate_po_total(item.purchase_order_id)

        return updated_item

    def delete_item(self, item_id):
        item = self.repo.get_by_id(item_id)
        if not item:
            return None
        
        po_id = item.purchase_order_id
        self.repo.delete(item)

        # update PO total after you delete item 
        self._recalculate_po_total(po_id)

        return item
       
    