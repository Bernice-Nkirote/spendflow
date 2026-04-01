from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from uuid import UUID

from app.models.payments import Payment
from app.models.audit_log import AuditLog
from app.models.enums import (
    PaymentStatusEnum,
    InvoiceStateEnum,
    POStatusEnum
)

from app.repositories.payment_repository import PaymentRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.services.audit_log_service import AuditLogService

class PaymentService:
    def __init__(self):
        self.payment_repo = PaymentRepository()
        self.invoice_repo = InvoiceRepository()
        self.po_repo = PurchaseOrderRepository()

    # CREATE PAYMENT
    def create_payment(self, db: Session, data, current_user=None):

        try:
            # 1. Get invoice
            invoice = self.invoice_repo.get_by_id(db, data.invoice_id)
            if not invoice:
                raise HTTPException(status_code=404, detail="Invoice not found")

            # 2. Validate invoice is payable
            if invoice.status not in [
                InvoiceStateEnum.SENT,
                InvoiceStateEnum.PARTIALLY_PAID
            ]:
                raise HTTPException(
                    status_code=400,
                    detail="Invoice is not payable"
                )

            # 3. Get total paid (ONLY completed payments)
            total_paid = self.payment_repo.get_total_paid(db, data.invoice_id)

            # 4. Prevent overpayment
            if total_paid + data.amount > invoice.amount:
                raise HTTPException(
                    status_code=400,
                    detail="Overpayment not allowed"
                )

            # 5. Create payment - created object in memory, doens't touch database
            payment = Payment(
                **data.dict(),
                status=PaymentStatusEnum.COMPLETED,  # MVP assumption
                created_by=getattr(current_user, "id", None)
            )

            self.payment_repo.create(db, payment)

            # 6. Update invoice status
            new_total = total_paid + data.amount

            if new_total == invoice.amount:
                invoice.status = InvoiceStateEnum.PAID
            else:
                invoice.status = InvoiceStateEnum.PARTIALLY_PAID

            # 7. Update PO status
            po = invoice.purchase_order

            all_paid = all(
                inv.status == InvoiceStateEnum.PAID
                for inv in po.invoices
            )

            if all_paid:
                po.status = POStatusEnum.COMPLETED

            AuditLogService.log(
                db=db,
                entity="payment",
                entity_id=payment.id,
                action="CREATE",
                user_id=getattr(current_user, "id", None),
                old_values=None,
                new_values={
                    "invoice_id": str(payment.invoice_id),
                    "amount": str(payment.amount),
                    "status": payment.status.value,
                    "payment_method": payment.payment_method.value
                }
            )

            # 9. Commit everything
            db.commit()
            db.refresh(payment)

            return payment

        except SQLAlchemyError:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail="Database error occurred"
            )

    # GET PAYMENTS FOR AN INVOICE
    def get_payments_by_invoice(self, db: Session, invoice_id: UUID):
        payments = self.payment_repo.get_by_invoice(db, invoice_id)

        if not payments:
            return []  # return empty list instead of error

        return payments

    # GET SINGLE PAYMENT
    def get_payment(self, db: Session, payment_id: UUID):
        payment = self.payment_repo.get_by_id(db, payment_id)

        if not payment:
            raise HTTPException(
                status_code=404,
                detail="Payment not found"
            )

        return payment

    # GET PAYMENTS BY STATUS (for reports / dashboards)
    def get_payments_by_status(self, db: Session, status: PaymentStatusEnum):
        return self.payment_repo.get_by_status(db, status)