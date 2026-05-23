from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.department import Department
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_requisition import PurchaseRequisition
from app.models.user import User


class DepartmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, department: Department) -> Department:
        self.db.add(department)
        self.db.flush()
        self.db.refresh(department)
        return department

    def get_by_id(self, department_id: UUID, company_id: UUID) -> Optional[Department]:
        return (
            self.db.query(Department)
            .filter(
                Department.id == department_id,
                Department.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
        skip: int | None = None,
        limit: int | None = None,
    ) -> list[Department]:
        query = (
            self.db.query(Department)
            .filter(Department.company_id == company_id)
            .order_by(Department.created_at.desc())
        )

        if skip is not None:
            query = query.offset(skip)

        if limit is not None:
            query = query.limit(limit)

        return query.all()

    def count_all(self, company_id: UUID) -> int:
        return (
            self.db.query(Department)
            .filter(Department.company_id == company_id)
            .count()
        )

    def get_by_name(self, name: str, company_id: UUID) -> Optional[Department]:
        return (
            self.db.query(Department)
            .filter(
                Department.name == name,
                Department.company_id == company_id,
            )
            .first()
        )

    def has_users(self, department_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(User)
            .filter(
                User.department_id == department_id,
                User.company_id == company_id,
            )
            .first()
            is not None
        )

    def has_requisitions(self, department_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(PurchaseRequisition)
            .filter(
                PurchaseRequisition.department_id == department_id,
                PurchaseRequisition.company_id == company_id,
            )
            .first()
            is not None
        )

    def has_purchase_orders(self, department_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(PurchaseOrder)
            .filter(
                PurchaseOrder.department_id == department_id,
                PurchaseOrder.company_id == company_id,
            )
            .first()
            is not None
        )

    def update(self, department: Department) -> Department:
        self.db.flush()
        self.db.refresh(department)
        return department

    def delete(self, department: Department) -> None:
        self.db.delete(department)
        self.db.flush()