from sqlalchemy.orm import Session
from sqlalchemy import func
from uuid import UUID

from app.models.payments import Payment
from app.models.enums import PaymentStatusEnum

class PaymentRepository:

    def create(self, db: Session, payment: Payment):
        db.add(payment)
        return payment
    
    def get_total_paid(self, db: Session, invoice_id: UUID):
        # Only count completed payments

        total = db.query(
            func.coalesce(func.sum(Payment.amount), 0)
        ).filter(
            Payment.invoice_id == invoice_id,
            Payment.status == PaymentStatusEnum.COMPLETED
        ).scalar()

        return total
    
    def get_by_invoice(self, db: Session, invoice_id: UUID):
        return db.query(Payment)\
                 .filter(Payment.invoice_id == invoice_id)\
                 .order_by(Payment.created_at.desc())\
                 .all()       

# Helps with audit tracing and refunds
    def get_by_id(self, db: Session, payment_id: UUID):
        return db.query(Payment)\
             .filter(Payment.id == payment_id)\
             .first()
    
#  Helps to filter by status, so you can be able to filter pending payments and pay them
    def get_by_status(self, db: Session, status: PaymentStatusEnum):
        return db.query(Payment)\
             .filter(Payment.status == status)\
             .all()