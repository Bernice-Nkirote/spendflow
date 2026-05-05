from fastapi import APIRouter

from app.models.enums import PRStatusEnum, POStatusEnum, InvoiceStatusEnum, PaymentStatusEnum, PaymentMethodEnum

router = APIRouter(prefix="/metadata", tags=["Metadata"])

@router.get("/enums/report-statuses")
def get_report_statuses():
    return{
        "purchase-requisitions": [status.value for status in PRStatusEnum],
        "purchase-orders": [status.value for status in POStatusEnum],
        "invoices": [status.value for status in InvoiceStatusEnum],
        "outstanding-invoices": [status.value for status in InvoiceStatusEnum],
        "payments": [status.value for status in PaymentStatusEnum], 
    }

@router.get("/enums/payment-methods")
def get_payment_methods():
    return [method.value for method in PaymentMethodEnum]
