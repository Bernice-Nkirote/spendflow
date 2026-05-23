from uuid import UUID

from sqlalchemy.orm import Session, joinedload

from app.models.enums import POStatusEnum
from app.models.purchase_order import PurchaseOrder

class PurchaseOrderRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, po: PurchaseOrder) -> PurchaseOrder:
        self.db.add(po)
        self.db.flush()
        self.db.refresh(po)
        return po

    def get_by_id(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder | None:
        return (
        self.db.query(PurchaseOrder)
        .options(
            joinedload(PurchaseOrder.supplier),
            joinedload(PurchaseOrder.department),
            joinedload(PurchaseOrder.creator),
            joinedload(PurchaseOrder.submitter),
            joinedload(PurchaseOrder.issuer),
            joinedload(PurchaseOrder.signed_pdf_uploader),
            joinedload(PurchaseOrder.purchase_requisition),
            joinedload(PurchaseOrder.items),
        )
        .filter(
            PurchaseOrder.id == po_id,
            PurchaseOrder.company_id == company_id,
        )
        .first()
    )

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseOrder]:
        return (
            self.db.query(PurchaseOrder)
            .options(
                joinedload(PurchaseOrder.supplier),
                joinedload(PurchaseOrder.department),
                joinedload(PurchaseOrder.creator),
                joinedload(PurchaseOrder.submitter),
                joinedload(PurchaseOrder.issuer),
                joinedload(PurchaseOrder.signed_pdf_uploader),
                joinedload(PurchaseOrder.purchase_requisition),
                joinedload(PurchaseOrder.items),
            )
            .filter(PurchaseOrder.company_id == company_id)
            .order_by(PurchaseOrder.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_all(
        self,
        company_id: UUID,
    ) -> int:
        return (
            self.db.query(PurchaseOrder)
            .filter(PurchaseOrder.company_id == company_id)
            .count()
        )

    def get_by_po_number(
        self,
        po_number: str,
        company_id: UUID,
    ) -> PurchaseOrder | None:
        return (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.po_number == po_number,
                PurchaseOrder.company_id == company_id,
            )
            .first()
        )

    def get_by_purchase_requisition_id(
        self,
        purchase_requisition_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder | None:
        return (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.purchase_requisition_id == purchase_requisition_id,
                PurchaseOrder.company_id == company_id,
            )
            .first()
        )

    def get_by_status(
        self,
        status: POStatusEnum,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseOrder]:
        return (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.status == status,
                PurchaseOrder.company_id == company_id,
            )
            .order_by(PurchaseOrder.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseOrder]:
        return (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.supplier_id == supplier_id,
                PurchaseOrder.company_id == company_id,
            )
            .order_by(PurchaseOrder.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_by_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
    ) -> int:
        return (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.supplier_id == supplier_id,
                PurchaseOrder.company_id == company_id,
            )
            .count()
        )

    def update(self, po: PurchaseOrder) -> PurchaseOrder:
        self.db.flush()
        self.db.refresh(po)
        return po

    def delete(self, po: PurchaseOrder) -> None:
        self.db.delete(po)
        self.db.flush()