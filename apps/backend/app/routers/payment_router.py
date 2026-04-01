from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID

from app.schemas.payment_schema import PaymentCreate, PaymentResponse
from app.services.payment_services import PaymentService
from app.core.database import get_db
from app.models.enums import PaymentStatusEnum

# Placeholder for authentication
def get_current_user():
    return None

router = APIRouter(prefix="/payments", tags=["Payments"])

payment_service = PaymentService()

# CREATE PAYMENT
@router.post("/", response_model=PaymentResponse)
def create_payment(
    data: PaymentCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return payment_service.create_payment(db, data, current_user)

# GET PAYMENTS BY INVOICE
@router.get("/invoice/{invoice_id}", response_model=list[PaymentResponse])
def get_payments_by_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db)
):
    return payment_service.get_payments_by_invoice(db, invoice_id)

# GET SINGLE PAYMENT
@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: UUID,
    db: Session = Depends(get_db)
):
    return payment_service.get_payment(db, payment_id)

# FILTER PAYMENTS BY STATUS (VERY USEFUL)
@router.get("/status/{status}", response_model=list[PaymentResponse])
def get_payments_by_status(
    status: PaymentStatusEnum,
    db: Session = Depends(get_db)
):
    return payment_service.get_payments_by_status(db, status)