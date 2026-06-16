from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.models.supplier import Supplier


class AssistantRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_supplier_candidates(self, company_id: UUID, limit: int = 100):
        return (
            self.db.query(
                Supplier.id.label("supplier_id"),
                Supplier.name.label("supplier_name"),
                Supplier.category,
                Supplier.sub_category,
                Supplier.contact_person,
                Supplier.email,
                Supplier.phone,
                Supplier.address.label("location"),
                func.count(PurchaseOrder.id).label("po_count"),
                func.coalesce(func.sum(PurchaseOrder.total_amount), 0).label(
                    "total_order_value"
                ),
                func.max(PurchaseOrder.created_at).label("last_order_at"),
            )
            .outerjoin(
                PurchaseOrder,
                (PurchaseOrder.supplier_id == Supplier.id)
                & (PurchaseOrder.company_id == company_id),
            )
            .filter(
                Supplier.company_id == company_id,
                Supplier.is_active == True,
            )
            .group_by(
                Supplier.id,
                Supplier.name,
                Supplier.category,
                Supplier.sub_category,
                Supplier.contact_person,
                Supplier.email,
                Supplier.phone,
                Supplier.address,
            )
            .order_by(func.max(PurchaseOrder.created_at).desc().nullslast())
            .limit(limit)
            .all()
        )

    def get_recent_supplied_item_names(
        self,
        supplier_id: UUID,
        company_id: UUID,
        limit: int = 6,
    ) -> list[str]:
        rows = (
            self.db.query(
                PurchaseOrderItem.item_name,
                func.max(PurchaseOrder.created_at).label("last_supplied_at"),
            )
            .join(
                PurchaseOrder,
                PurchaseOrder.id == PurchaseOrderItem.purchase_order_id,
            )
            .filter(
                PurchaseOrder.company_id == company_id,
                PurchaseOrder.supplier_id == supplier_id,
                PurchaseOrderItem.company_id == company_id,
            )
            .group_by(PurchaseOrderItem.item_name)
            .order_by(func.max(PurchaseOrder.created_at).desc())
            .limit(limit)
            .all()
        )

        return [row.item_name for row in rows if row.item_name]
