import uuid

from fastapi import HTTPException, status

from app.models.approval_instance import ApprovalInstance
from app.models.enums import ApprovalStatus, EntityTypeEnum
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.schemas.approval_instance_schema import ApprovalInstanceCreate


class ApprovalInstanceService:
    def __init__(
        self,
        repo: ApprovalInstanceRepository,
        workflow_level_repo: WorkflowLevelRepository,
        pr_repo: PurchaseRequisitionRepository,
        po_repo: PurchaseOrderRepository,
        invoice_repo: InvoiceRepository,
        payment_repo: PaymentRepository,
    ):
        self.repo = repo
        self.workflow_level_repo = workflow_level_repo
        self.pr_repo = pr_repo
        self.po_repo = po_repo
        self.invoice_repo = invoice_repo
        self.payment_repo = payment_repo

    def _enrich_instance(self, instance: ApprovalInstance) -> ApprovalInstance:
        """
        Adds business-readable metadata to an approval instance response.
        and It only attaches response fields for frontend display.
        """
        instance.entity_reference = None
        instance.entity_title = None
        instance.requester_name = None
        instance.total_amount = None
        instance.currency = None
        instance.exchange_rate = None
        instance.base_currency = None
        instance.base_amount = None
        instance.exchange_rate_date = None
        instance.workflow_name = instance.workflow.name if instance.workflow else None
        instance.current_level_name = (
            instance.current_level.name if instance.current_level else None
        )

        if instance.entity_type == EntityTypeEnum.PR:
            requisition = self.pr_repo.get_by_id(
                instance.entity_id,
                instance.company_id,
            )

            if requisition:
                instance.entity_reference = requisition.pr_number
                instance.entity_title = requisition.title
                instance.requester_name = getattr(
                    requisition,
                    "requested_by_name",
                    None,
                )

                if not instance.requester_name:
                    requester = getattr(requisition, "requester", None)
                    instance.requester_name = getattr(requester, "name", None)

                instance.total_amount = (
                    float(requisition.total_amount)
                    if requisition.total_amount is not None
                    else None
                )
                instance.exchange_rate = (
                    float(requisition.exchange_rate)
                    if requisition.exchange_rate is not None
                    else None
                )
                instance.base_currency = requisition.base_currency
                instance.base_amount = (
                    float(requisition.base_amount)
                    if requisition.base_amount is not None
                    else None
                )
                instance.exchange_rate_date = requisition.exchange_rate_date

        if instance.entity_type == EntityTypeEnum.PO:
            purchase_order = self.po_repo.get_by_id(
                po_id=instance.entity_id,
                company_id=instance.company_id,
            )

            if purchase_order:
                instance.entity_reference = purchase_order.po_number
                instance.entity_title = (
                    f"Purchase Order for {purchase_order.supplier.name}"
                    if purchase_order.supplier
                    else "Purchase Order"
                )

                instance.requester_name = (
                    purchase_order.submitter.name
                    if purchase_order.submitter
                    else None
                )

                if not instance.requester_name:
                    instance.requester_name = (
                        purchase_order.creator.name
                        if purchase_order.creator
                        else None
                    )

                instance.total_amount = (
                    float(purchase_order.total_amount)
                    if purchase_order.total_amount is not None
                    else None
                )

                instance.exchange_rate = (
                    float(purchase_order.exchange_rate)
                    if purchase_order.exchange_rate is not None
                    else None
                )
                instance.base_currency = purchase_order.base_currency
                instance.base_amount = (
                    float(purchase_order.base_amount)
                    if purchase_order.base_amount is not None
                    else None
                )
                instance.exchange_rate_date = purchase_order.exchange_rate_date

        if instance.entity_type == EntityTypeEnum.INVOICE:
            invoice = self.invoice_repo.get_by_id(
                invoice_id=instance.entity_id,
                company_id=instance.company_id,
            )

            if invoice:
                instance.entity_reference = invoice.invoice_number

                supplier_name = invoice.supplier.name if invoice.supplier else None
                po_number = (
                    invoice.purchase_order.po_number
                    if invoice.purchase_order
                    else None
                )

                if supplier_name and po_number:
                    instance.entity_title = f"Invoice from {supplier_name} for {po_number}"
                elif supplier_name:
                    instance.entity_title = f"Invoice from {supplier_name}"
                else:
                    instance.entity_title = "Invoice"

                instance.requester_name = (
                    invoice.submitted_by_user.name
                    if invoice.submitted_by_user
                    else None
                )

                if not instance.requester_name:
                    instance.requester_name = (
                        invoice.submitted_by_supplier_user.email
                        if invoice.submitted_by_supplier_user
                        else None
                    )

                instance.total_amount = (
                    float(invoice.total_amount)
                    if invoice.total_amount is not None
                    else None
                )

                instance.currency = invoice.currency
                instance.exchange_rate = (
                    float(invoice.exchange_rate)
                    if invoice.exchange_rate is not None
                    else None
                )
                instance.base_currency = invoice.base_currency
                instance.base_amount = (
                    float(invoice.base_amount)
                    if invoice.base_amount is not None
                    else None
                )
                instance.exchange_rate_date = invoice.exchange_rate_date

        if instance.entity_type == EntityTypeEnum.PAYMENT:
            payment = self.payment_repo.get_by_id(
                payment_id=instance.entity_id,
                company_id=instance.company_id,
            )

            if payment:
                invoice = payment.invoice

                invoice_number = (
                    invoice.invoice_number if invoice else None
                )

                supplier_name = (
                    invoice.supplier.name
                    if invoice and invoice.supplier
                    else None
                )

                instance.entity_reference = (
                    f"Payment for {invoice_number}"
                    if invoice_number
                    else "Payment"
                )

                if supplier_name and invoice_number:
                    instance.entity_title = (
                        f"Payment to {supplier_name} for invoice {invoice_number}"
                    )
                elif supplier_name:
                    instance.entity_title = f"Payment to {supplier_name}"
                else:
                    instance.entity_title = "Payment"

                instance.requester_name = (
                    payment.created_by_user.name
                    if payment.created_by_user
                    else None
                )

                instance.total_amount = (
                    float(payment.amount)
                    if payment.amount is not None
                    else None
                )

                instance.currency = payment.currency
                instance.exchange_rate = (
                    float(payment.exchange_rate)
                    if payment.exchange_rate is not None
                    else None
                )
                instance.base_currency = payment.base_currency
                instance.base_amount = (
                    float(payment.base_amount)
                    if payment.base_amount is not None
                    else None
                )
                instance.exchange_rate_date = payment.exchange_rate_date

        return instance
    
    def create_instance(
        self,
        data: ApprovalInstanceCreate,
        company_id: uuid.UUID,
    ) -> ApprovalInstance:
        if not data.workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow id is required",
            )

        if not data.entity_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entity id is required",
            )

        if not data.entity_type:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Entity type is required",
            )

        existing_pending = self.repo.get_pending_by_entity(
            entity_id=data.entity_id,
            entity_type=data.entity_type,
            company_id=company_id,
        )
        if existing_pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending approval instance already exists for this entity",
            )

        first_level = self.workflow_level_repo.get_first_level(
            workflow_id=data.workflow_id,
            company_id=company_id,
        )
        if not first_level:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow has no levels configured or does not exist in this company",
            )

        instance = ApprovalInstance(
            company_id=company_id,
            workflow_id=data.workflow_id,
            entity_id=data.entity_id,
            entity_type=data.entity_type,
            current_level_id=first_level.id,
            status=ApprovalStatus.PENDING,
        )

        created_instance = self.repo.create(instance)
        self.repo.db.commit()
        self.repo.db.refresh(created_instance)

        return created_instance

    def get_instance(
        self,
        instance_id: uuid.UUID,
        company_id: uuid.UUID,
    ) -> ApprovalInstance:
        if not instance_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval instance id is required",
            )

        instance = self.repo.get_by_id(instance_id, company_id)
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval instance not found",
            )

        return self._enrich_instance(instance)

    def get_all_instances(
        self,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ApprovalInstance]:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip cannot be negative",
            )

        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        instances = self.repo.get_all(company_id, skip=skip, limit=limit)

        return [self._enrich_instance(instance) for instance in instances]

    def get_paginated_instances(
        self,
        company_id: uuid.UUID,
        skip: int = 0,
        limit: int = 10,
        status_value: ApprovalStatus | None = None,
        exclude_status: ApprovalStatus | None = None,
    ) -> dict:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip cannot be negative",
            )

        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        if status_value and exclude_status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use either status or exclude_status, not both",
            )

        instances = self.repo.get_paginated(
            company_id=company_id,
            skip=skip,
            limit=limit,
            status=status_value,
            exclude_status=exclude_status,
        )

        total_count = self.repo.count_all(
            company_id=company_id,
            status=status_value,
            exclude_status=exclude_status,
        )

        return {
            "rows": [self._enrich_instance(instance) for instance in instances],
            "total_count": total_count,
        }

    def get_my_pending_queue(
        self,
        company_id: uuid.UUID,
        role_id: uuid.UUID,
        department_id: uuid.UUID | None,
        skip: int = 0,
        limit: int = 10,
    ) -> dict:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip cannot be negative",
            )

        if limit <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero",
            )

        instances = self.repo.get_my_pending_queue(
            company_id=company_id,
            role_id=role_id,
            department_id=department_id,
            skip=skip,
            limit=limit,
        )

        total_count = self.repo.count_my_pending_queue(
            company_id=company_id,
            role_id=role_id,
            department_id=department_id,
        )

        return {
            "rows": [self._enrich_instance(instance) for instance in instances],
            "total_count": total_count,
        }

    def update_instance_status(
        self,
        instance_id: uuid.UUID,
        status_value: ApprovalStatus,
        company_id: uuid.UUID,
    ) -> ApprovalInstance:
        instance = self.get_instance(instance_id, company_id)

        instance.status = status_value

        updated_instance = self.repo.update(instance)
        self.repo.db.commit()
        self.repo.db.refresh(updated_instance)

        return updated_instance