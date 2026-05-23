from typing import Optional
from uuid import UUID

from sqlalchemy.orm import Session

from app.models.approval_action import ApprovalAction
from app.models.invoice import Invoice
from app.models.purchase_requisition import PurchaseRequisition
from app.models.user import User


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: UUID, company_id: UUID) -> Optional[User]:
        return (
            self.db.query(User)
            .filter(
                User.id == user_id,
                User.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[User]:
        return (
            self.db.query(User)
            .filter(User.company_id == company_id)
            .order_by(User.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def count_all(self, company_id: UUID) -> int:
        return (
            self.db.query(User)
            .filter(User.company_id == company_id)
            .count()
        )

    def get_by_email(self, email: str, company_id: UUID) -> Optional[User]:
        return (
            self.db.query(User)
            .filter(
                User.email == email,
                User.company_id == company_id,
            )
            .first()
        )

    def get_by_phone_number(
        self,
        phone_number: str,
        company_id: UUID,
    ) -> Optional[User]:
        return (
            self.db.query(User)
            .filter(
                User.phone_number == phone_number,
                User.company_id == company_id,
            )
            .first()
        )

    def has_requisitions(self, user_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(PurchaseRequisition)
            .filter(
                PurchaseRequisition.requested_by == user_id,
                PurchaseRequisition.company_id == company_id,
            )
            .first()
            is not None
        )

    def has_approval_actions(self, user_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(ApprovalAction)
            .filter(
                ApprovalAction.user_id == user_id,
                ApprovalAction.company_id == company_id,
            )
            .first()
            is not None
        )

    def has_submitted_invoices(self, user_id: UUID, company_id: UUID) -> bool:
        return (
            self.db.query(Invoice)
            .filter(
                Invoice.submitted_by_user_id == user_id,
                Invoice.company_id == company_id,
            )
            .first()
            is not None
        )

    def update(self, user: User) -> User:
        self.db.flush()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.flush()