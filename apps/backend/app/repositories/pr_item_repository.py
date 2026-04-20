from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.purchase_requisition_item import PurchaseRequisitionItem


class PurchaseRequisitionItemRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, item: PurchaseRequisitionItem) -> PurchaseRequisitionItem:
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def create_many(self, items: list[PurchaseRequisitionItem]) -> list[PurchaseRequisitionItem]:
        self.db.add_all(items)
        self.db.commit()
        for item in items:
            self.db.refresh(item)
        return items

    def get_by_id(self, item_id: UUID, company_id: UUID) -> Optional[PurchaseRequisitionItem]:
        return (
            self.db.query(PurchaseRequisitionItem)
            .filter(
                PurchaseRequisitionItem.id == item_id,
                PurchaseRequisitionItem.company_id == company_id,
            )
            .first()
        )

    def get_by_requisition_id(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> list[PurchaseRequisitionItem]:
        return (
            self.db.query(PurchaseRequisitionItem)
            .filter(
                PurchaseRequisitionItem.requisition_id == requisition_id,
                PurchaseRequisitionItem.company_id == company_id,
            )
            .order_by(PurchaseRequisitionItem.created_at.asc())
            .all()
        )

    def update(
        self,
        item: PurchaseRequisitionItem,
        update_data: dict,
    ) -> PurchaseRequisitionItem:
        for key, value in update_data.items():
            setattr(item, key, value)

        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: PurchaseRequisitionItem) -> None:
        self.db.delete(item)
        self.db.commit()