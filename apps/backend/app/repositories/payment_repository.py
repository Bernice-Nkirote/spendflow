from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.models.enums import PaymentStatusEnum
from app.models.payments import Payment


class PaymentRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, payment: Payment) -> Payment:
        self.db.add(payment)
        self.db.flush()
        self.db.refresh(payment)
        return payment

    def get_by_id(
        self,
        payment_id: UUID,
        company_id: UUID,
    ) -> Payment | None:
        return (
            self.db.query(Payment)
            .options(
                joinedload(Payment.invoice),
                joinedload(Payment.created_by_user),
            )
            .filter(
                Payment.id == payment_id,
                Payment.company_id == company_id,
            )
            .first()
        )

    def get_all(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Payment]:
        return (
            self.db.query(Payment)
            .filter(Payment.company_id == company_id)
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_invoice(
        self,
        invoice_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Payment]:
        return (
            self.db.query(Payment)
            .filter(
                Payment.invoice_id == invoice_id,
                Payment.company_id == company_id,
            )
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_by_status(
        self,
        payment_status: PaymentStatusEnum,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Payment]:
        return (
            self.db.query(Payment)
            .filter(
                Payment.status == payment_status,
                Payment.company_id == company_id,
            )
            .order_by(Payment.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_total_paid(
        self,
        invoice_id: UUID,
        company_id: UUID,
    ):
        return (
            self.db.query(func.coalesce(func.sum(Payment.amount), 0))
            .filter(
                Payment.invoice_id == invoice_id,
                Payment.company_id == company_id,
                Payment.status == PaymentStatusEnum.COMPLETED,
            )
            .scalar()
        )

    def update(self, payment: Payment) -> Payment:
        self.db.flush()
        self.db.refresh(payment)
        return payment

    def delete(self, payment: Payment) -> None:
        self.db.delete(payment)
        self.db.flush()