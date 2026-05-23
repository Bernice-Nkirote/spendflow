from uuid import UUID

from fastapi import HTTPException, status

from app.models.approval_instance import ApprovalInstance
from app.models.enums import (
    ApprovalStatus,
    EntityTypeEnum,
    InvoiceStatusEnum,
    PaymentMethodEnum,
    PaymentStatusEnum,
)
from app.models.payments import Payment
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.schemas.payment_schema import PaginatedPaymentResponse, PaymentCreate, PaymentUpdate
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.permission_service import PermissionService
from app.services.audit_log_service import AuditLogService
from app.services.exchange_rate_service import ExchangeRateService
from app.utils.value_helper.enum_utils import enum_value

class PaymentService:
    def __init__(
        self,
        payment_repo: PaymentRepository,
        invoice_repo: InvoiceRepository,
        workflow_repo:ApprovalWorkflowRepository,
        approval_instance_service: ApprovalInstanceService,
        permission_service: PermissionService,
        audit_log_service: AuditLogService,
        exchange_rate_service: ExchangeRateService,
    ):
        self.payment_repo = payment_repo
        self.invoice_repo = invoice_repo
        self.workflow_repo = workflow_repo
        self.approval_instance_service = approval_instance_service
        self.permission_service = permission_service
        self.audit_log_service = audit_log_service
        self.exchange_rate_service = exchange_rate_service
        
    def create_payment(
        self,
        payment_data: PaymentCreate,
        company_id: UUID,
        created_by: UUID | None = None,
        role_id: UUID |None = None,
    ) -> Payment:
        # PERMISSION CHECK
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="payment.create",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to create payments",
            )
        invoice = self.invoice_repo.get_by_id(
            invoice_id=payment_data.invoice_id,
            company_id=company_id,
        )
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found",
            )

        invoice_status = getattr(invoice.status, "value", str(invoice.status))
        if invoice_status not in {
            InvoiceStatusEnum.APPROVED.value,
            InvoiceStatusEnum.PARTIALLY_PAID.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payments can only be created for approved or partially paid invoices",
            )

        if payment_data.payment_method in {
            PaymentMethodEnum.MPESA,
            PaymentMethodEnum.BANK_TRANSFER,
        } and not payment_data.reference:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reference is required for this payment method",
            )

        total_reserved = self.payment_repo.get_total_reserved_amount(
            invoice_id=payment_data.invoice_id,
            company_id=company_id,
        )

        if total_reserved + payment_data.amount > invoice.total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Overpayment is not allowed",
            )

        payment = Payment(
            company_id=company_id,
            invoice_id=payment_data.invoice_id,
            amount=payment_data.amount,
            currency=invoice.currency,
            payment_method=payment_data.payment_method,
            reference=payment_data.reference,
            status=PaymentStatusEnum.DRAFT,
            created_by=created_by,
        )

        created_payment = self.payment_repo.create(payment)
        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PAYMENT",
            entity_id=created_payment.id,
            action="PAYMENT_CREATED",
            actor_user_id=created_by,
            description=f"Payment created for invoice {payment.invoice_id}",
            new_values_json={
                "invoice_id": str(payment.invoice_id),
                "amount": str(payment.amount),
                "payment_method": enum_value(payment.payment_method),
                "status": enum_value(payment.status),
            },
        )

        self.payment_repo.db.commit()
        self.payment_repo.db.refresh(created_payment)

        created_payment = self.payment_repo.get_by_id(
            payment_id=created_payment.id,
            company_id=company_id,
        )

        return self._enrich_payment(created_payment)

    def get_payment(
        self,
        payment_id: UUID,
        company_id: UUID,
    ) -> Payment:
        payment = self.payment_repo.get_by_id(
            payment_id=payment_id,
            company_id=company_id,
        )

        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found",
            )

        return self._enrich_payment(payment)

    def _enrich_payment(self, payment: Payment) -> Payment:
        payment.invoice_number = (
            payment.invoice.invoice_number if payment.invoice else None
        )

        payment.supplier_name = (
            payment.invoice.supplier.name
            if payment.invoice and payment.invoice.supplier
            else None
        )

        payment.created_by_name = (
            payment.created_by_user.name if payment.created_by_user else None
        )

        payment.currency = payment.currency

        return payment

    def get_all_payments(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Payment]:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip must be zero or greater",
            )

        if limit < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        payments = self.payment_repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        return [self._enrich_payment(payment) for payment in payments]

    def get_paginated_payments(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> dict:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip must be zero or greater",
            )

        if limit < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        payments = self.payment_repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        total_count = self.payment_repo.count_all(company_id=company_id)

        return {
            "rows": [self._enrich_payment(payment) for payment in payments],
            "total_count": total_count,
        }

    def get_all_payments_by_invoice(
        self,
        invoice_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Payment]:
        invoice = self.invoice_repo.get_by_id(
            invoice_id=invoice_id,
            company_id=company_id,
        )
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found",
            )

        payments = self.payment_repo.get_by_invoice(
            invoice_id=invoice_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        return [self._enrich_payment(payment) for payment in payments]

    def get_all_payments_by_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Payment]:
        if not supplier_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier id is required",
            )

        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip must be zero or greater",
            )

        if limit < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        payments = self.payment_repo.get_by_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        return [self._enrich_payment(payment) for payment in payments]

    def get_all_payments_by_supplier_paginated(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> PaginatedPaymentResponse:
        rows = self.get_all_payments_by_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        total_count = self.payment_repo.count_by_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
        )

        return PaginatedPaymentResponse(
            rows=rows,
            total_count=total_count,
        )

    def get_all_payments_by_status(
        self,
        payment_status: PaymentStatusEnum,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Payment]:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip must be zero or greater",
            )

        if limit < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        payments = self.payment_repo.get_by_status(
            payment_status=payment_status,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        return [self._enrich_payment(payment) for payment in payments]

    def update_payment(
        self,
        payment_id: UUID,
        payment_data: PaymentUpdate,
        company_id: UUID,
        actor_user_id: UUID | None = None,
    ) -> Payment:
        payment = self.get_payment(payment_id, company_id)

        payment_status = getattr(payment.status, "value", str(payment.status))
        if payment_status not in {
            PaymentStatusEnum.DRAFT.value,
            PaymentStatusEnum.REJECTED.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft or rejected payments can be updated",
            )
        
        # capture the old state first
        old_values = {
            "amount": str(payment.amount),
            "status": enum_value(payment.status),
            "reference": payment.reference,
        }
        # extract the incoming changes
        update_data = payment_data.model_dump(exclude_unset=True)

        if "reference" in update_data and update_data["reference"] is not None:
            reference = update_data["reference"].strip()
            update_data["reference"] = reference or None

        payment_method = update_data.get("payment_method", payment.payment_method)
        reference = update_data.get("reference", payment.reference)

        if payment_method in {
            PaymentMethodEnum.MPESA,
            PaymentMethodEnum.BANK_TRANSFER,
        } and not reference:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reference is required for this payment method",
            )

        if "amount" in update_data:
            invoice = self.invoice_repo.get_by_id(
                invoice_id=payment.invoice_id,
                company_id=company_id,
            )
            if not invoice:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invoice not found",
                )

            total_reserved = self.payment_repo.get_total_reserved_amount(
                invoice_id=payment.invoice_id,
                company_id=company_id,
            )

            adjusted_reserved_total = (
                total_reserved
                - payment.amount
                + update_data["amount"]
            )

            if adjusted_reserved_total > invoice.total_amount:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Overpayment is not allowed",
                )

        for field, value in update_data.items():
            setattr(payment, field, value)

        updated_payment = self.payment_repo.update(payment)

        # AUDIT after mutation 
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PAYMENT",
            entity_id=payment.id,
            action="PAYMENT_UPDATED",
            actor_user_id=actor_user_id,
            description=f"Payment {payment.id} updated",
            old_values_json=old_values,
            new_values_json=update_data,
        )

        self.payment_repo.db.commit()
        self.payment_repo.db.refresh(updated_payment)

        updated_payment = self.payment_repo.get_by_id(
            payment_id=updated_payment.id,
            company_id=company_id,
        )

        return self._enrich_payment(updated_payment)

    def submit_payment(
        self,
        payment_id: UUID,
        company_id: UUID,
        role_id: UUID,
        actor_user_id: UUID |None = None,
    ) -> Payment:
        # PERMISSION CHECK
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="payment.submit",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to submit payments",
            )
        payment = self.get_payment(payment_id, company_id)

        payment_status = getattr(payment.status, "value", str(payment.status))
        if payment_status not in {
            PaymentStatusEnum.DRAFT.value,
            PaymentStatusEnum.REJECTED.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft or rejected payments can be submitted",
            )

        invoice = self.invoice_repo.get_by_id(
            invoice_id=payment.invoice_id,
            company_id=company_id,
        )
        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found",
            )

        invoice_status = getattr(invoice.status, "value", str(invoice.status))
        if invoice_status not in {
            InvoiceStatusEnum.APPROVED.value,
            InvoiceStatusEnum.PARTIALLY_PAID.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Payment can only be submitted for approved or partially paid invoices",
            )

        if payment.payment_method in {
            PaymentMethodEnum.MPESA,
            PaymentMethodEnum.BANK_TRANSFER,
        } and not payment.reference:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reference is required for this payment method",
            )

        total_reserved = self.payment_repo.get_total_reserved_amount(
            invoice_id=payment.invoice_id,
            company_id=company_id,
        )

        if total_reserved > invoice.total_amount:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Overpayment is not allowed",
            )

        workflow = self.workflow_repo.get_active_by_entity_type(
            entity_type=EntityTypeEnum.PAYMENT,
            company_id=company_id,
        )
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active approval workflow found for payments",
            )

        first_level = self.approval_instance_service.workflow_level_repo.get_first_level(
            workflow_id=workflow.id,
            company_id=company_id,
        )
        if not first_level:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow has no levels configured or does not exist in this company",
            )

        existing_pending = self.approval_instance_service.repo.get_pending_by_entity(
            entity_id=payment.id,
            entity_type=EntityTypeEnum.PAYMENT,
            company_id=company_id,
        )
        if existing_pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending approval instance already exists for this payment",
            )

        base_amount, exchange_rate, base_currency, exchange_rate_date = (
            self.exchange_rate_service.convert_transaction_to_company_base_currency(
                company_id=company_id,
                amount=payment.amount,
                transaction_currency=payment.currency,
                as_of_date=payment.created_at.date(),
            )
        )

        payment.exchange_rate = exchange_rate
        payment.base_currency = base_currency
        payment.base_amount = base_amount
        payment.exchange_rate_date = exchange_rate_date

        approval_instance = ApprovalInstance(
            company_id=company_id,
            workflow_id=workflow.id,
            entity_id=payment.id,
            entity_type=EntityTypeEnum.PAYMENT,
            current_level_id=first_level.id,
            status=ApprovalStatus.PENDING,
        )

        self.approval_instance_service.repo.create(approval_instance)

        payment.status = PaymentStatusEnum.PENDING_APPROVAL
        updated_payment = self.payment_repo.update(payment)

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PAYMENT",
            entity_id=payment.id,
            action="PAYMENT_SUBMITTED",
            actor_user_id=actor_user_id,
            description=f"Payment {payment.id} submitted for approval",
            details_json={
                "approval_workflow_started": True,
                "status": enum_value(payment.status),
            }
        )

        self.payment_repo.db.commit()
        self.payment_repo.db.refresh(updated_payment)

        updated_payment = self.payment_repo.get_by_id(
            payment_id=updated_payment.id,
            company_id=company_id,
        )

        return self._enrich_payment(updated_payment)

    def delete_payment(
        self,
        payment_id: UUID,
        company_id: UUID,
        role_id: UUID,
        actor_user_id: UUID | None = None,
    ) -> None:
        # PERMISSION CHECK
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="payment.cancel",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to delete payments",
            )
        
        payment = self.get_payment(payment_id, company_id)

        existing_pending = self.approval_instance_service.repo.get_pending_by_entity(
            entity_id=payment.id,
            entity_type=EntityTypeEnum.PAYMENT,
            company_id=company_id,
        )

        if existing_pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This payment has already been submitted for approval and cannot be deleted.",
            )

        payment_status = getattr(payment.status, "value", str(payment.status))

        if payment_status not in {
            PaymentStatusEnum.DRAFT.value,
            PaymentStatusEnum.REJECTED.value,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft or rejected payments can be deleted",
            )

        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PAYMENT",
            entity_id=payment.id,
            action="PAYMENT_CANCELLED",
            actor_user_id=actor_user_id,
            description=f"Payment {payment.id} cancelled",
            old_values_json={
                "status": enum_value(payment.status),
                "amount": str(payment.amount),
            },
        )

        self.payment_repo.delete(payment)
        self.payment_repo.db.commit()