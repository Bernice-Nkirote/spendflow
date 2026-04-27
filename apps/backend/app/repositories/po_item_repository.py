from uuid import UUID

from sqlalchemy.orm import Session

from app.models.purchase_order_item import PurchaseOrderItem


class PurchaseOrderItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, item: PurchaseOrderItem) -> PurchaseOrderItem:
        self.db.add(item)
        self.db.flush()
        self.db.refresh(item)
        return item

    def get_by_id(
        self,
        item_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrderItem | None:
        return (
            self.db.query(PurchaseOrderItem)
            .filter(
                PurchaseOrderItem.id == item_id,
                PurchaseOrderItem.company_id == company_id,
            )
            .first()
        )

    def get_all_by_po(
        self,
        purchase_order_id: UUID,
        company_id: UUID,
    ) -> list[PurchaseOrderItem]:
        return (
            self.db.query(PurchaseOrderItem)
            .filter(
                PurchaseOrderItem.purchase_order_id == purchase_order_id,
                PurchaseOrderItem.company_id == company_id,
            )
            .order_by(PurchaseOrderItem.created_at.asc())
            .all()
        )

    def update(self, item: PurchaseOrderItem) -> PurchaseOrderItem:
        self.db.flush()
        self.db.refresh(item)
        return item

    def delete(self, item: PurchaseOrderItem) -> None:
        self.db.delete(item)
        self.db.flush()