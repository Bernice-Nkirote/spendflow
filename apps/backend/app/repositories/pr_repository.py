from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session,joinedload

from app.models.enums import PRStatusEnum
from app.models.purchase_requisition import PurchaseRequisition


class PurchaseRequisitionRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, requisition: PurchaseRequisition) -> PurchaseRequisition:
        self.db.add(requisition)
        self.db.flush()
        self.db.refresh(requisition)
        return requisition

    def get_by_id(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> Optional[PurchaseRequisition]:
        return (
            self.db.query(PurchaseRequisition)
            .options(
                joinedload(PurchaseRequisition.department),
                joinedload(PurchaseRequisition.requester),
                joinedload(PurchaseRequisition.items),
            )
            .filter(
                PurchaseRequisition.id == requisition_id,
                PurchaseRequisition.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseRequisition]:
        return (
            self.db.query(PurchaseRequisition)
            .filter(PurchaseRequisition.company_id == company_id)
            .order_by(PurchaseRequisition.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_pr_number(
        self,
        pr_number: str,
        company_id: UUID,
    ) -> Optional[PurchaseRequisition]:
        return (
            self.db.query(PurchaseRequisition)
            .filter(
                PurchaseRequisition.pr_number == pr_number,
                PurchaseRequisition.company_id == company_id,
            )
            .first()
        )

    def get_by_status(
        self,
        status: PRStatusEnum,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseRequisition]:
        return (
            self.db.query(PurchaseRequisition)
            .filter(
                PurchaseRequisition.company_id == company_id,
                PurchaseRequisition.status == status,
            )
            .order_by(PurchaseRequisition.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_department(
        self,
        department_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseRequisition]:
        return (
            self.db.query(PurchaseRequisition)
            .filter(
                PurchaseRequisition.department_id == department_id,
                PurchaseRequisition.company_id == company_id,
            )
            .order_by(PurchaseRequisition.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def update(self, requisition: PurchaseRequisition) -> PurchaseRequisition:
        self.db.flush()
        self.db.refresh(requisition)
        return requisition

    def delete(self, requisition: PurchaseRequisition) -> None:
        self.db.delete(requisition)
        self.db.flush()