from uuid import UUID

from fastapi import HTTPException, status

from app.models.approval_action import ApprovalAction
from app.models.enums import (
    ActionType,
    ApprovalStatus,
    EntityTypeEnum,
    InvoiceStatusEnum,
    PaymentStatusEnum,
    POStatusEnum,
    PRStatusEnum,
)
from app.repositories.approval_action_repository import ApprovalActionRepository
from app.repositories.approval_instance_repository import ApprovalInstanceRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.payment_repository import PaymentRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.repositories.workflow_level_repository import WorkflowLevelRepository
from app.repositories.workflow_role_repository import WorkflowLevelRoleRepository
from app.schemas.approval_action_schema import ApprovalActionCreate
from app.services.audit_log_service import AuditLogService
from app.utils.value_helper.enum_utils import enum_value

class ApprovalActionService:
    def __init__(
        self,
        action_repo: ApprovalActionRepository,
        instance_repo: ApprovalInstanceRepository,
        level_role_repo: WorkflowLevelRoleRepository,
        workflow_level_repo: WorkflowLevelRepository,
        pr_repo: PurchaseRequisitionRepository,
        po_repo: PurchaseOrderRepository,
        invoice_repo: InvoiceRepository,
        payment_repo: PaymentRepository,
        audit_log_service: AuditLogService,
    ):
        self.action_repo = action_repo
        self.instance_repo = instance_repo
        self.level_role_repo = level_role_repo
        self.workflow_level_repo = workflow_level_repo
        self.pr_repo = pr_repo
        self.po_repo = po_repo
        self.invoice_repo = invoice_repo
        self.payment_repo = payment_repo
        self.audit_log_service = audit_log_service

    def create_action(
        self,
        data: ApprovalActionCreate,
        current_user,
    ) -> ApprovalAction:
        company_id = current_user.company_id

        if not data.instance_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval instance id is required",
            )

        if not data.level_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level id is required",
            )

        if data.action == ActionType.REJECTED:
            comment = (data.comment or "").strip()
            if not comment:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Comment is required when rejecting",
                )

        instance = self.instance_repo.get_by_id(data.instance_id, company_id)
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval instance not found",
            )

        level = self.workflow_level_repo.get_by_id(data.level_id, company_id)
        if not level:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Workflow level not found",
            )

        if instance.status != ApprovalStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This approval instance is no longer pending",
            )

        if instance.current_level_id != data.level_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This is not the current approval level",
            )

        if level.workflow_id != instance.workflow_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workflow level does not belong to this approval instance",
            )

        level_roles = self.level_role_repo.get_by_level(data.level_id, company_id)
        allowed_role_ids = {level_role.role_id for level_role in level_roles}

        if not allowed_role_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No roles are assigned to this workflow level",
            )

        if current_user.role_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no role assigned",
            )

        if current_user.role_id not in allowed_role_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not allowed to act on this workflow level",
            )

        existing_action_for_instance = self.action_repo.get_by_instance_and_user(
            instance_id=data.instance_id,
            user_id=current_user.id,
            company_id=company_id,
        )
        if existing_action_for_instance:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You have already acted on this approval request.",
            )

        existing_action = self.action_repo.get_by_instance_and_level_and_user(
            instance_id=data.instance_id,
            level_id=data.level_id,
            user_id=current_user.id,
            company_id=company_id,
        )
        if existing_action:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User has already acted on this workflow level",
            )

        action = ApprovalAction(
            company_id=company_id,
            instance_id=data.instance_id,
            level_id=data.level_id,
            user_id=current_user.id,
            action=data.action,
            comment=(data.comment or "").strip() or None,
        )

        created_action = self.action_repo.create(action)

        self._apply_workflow_progression(
            instance=instance,
            current_level=level,
            company_id=company_id,
            actor_user_id=current_user.id,
        )

        self.action_repo.db.commit()
        self.action_repo.db.refresh(created_action)

        return created_action

    def get_action(
        self,
        action_id: UUID,
        company_id: UUID,
    ) -> ApprovalAction:
        if not action_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval action id is required",
            )

        action = self.action_repo.get_by_id(action_id, company_id)
        if not action:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval action not found",
            )

        return action

    def get_all_actions(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 100,
    ) -> list[ApprovalAction]:
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

        return self.action_repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def get_actions_by_instance(
        self,
        instance_id: UUID,
        company_id: UUID,
    ) -> list[ApprovalAction]:
        if not instance_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approval instance id is required",
            )

        instance = self.instance_repo.get_by_id(instance_id, company_id)
        if not instance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Approval instance not found",
            )

        return self.action_repo.get_by_instance(instance_id, company_id)


    def _get_entity_approval_amount(
        self,
        instance,
        company_id: UUID,
    ):
        if instance.entity_type == EntityTypeEnum.PR:
            requisition = self.pr_repo.get_by_id(instance.entity_id, company_id)
            if not requisition:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Purchase requisition not found for approval amount check",
                )
            return (
                requisition.base_amount
                if requisition.base_amount is not None
                else requisition.total_amount
            )

        if instance.entity_type == EntityTypeEnum.PO:
            po = self.po_repo.get_by_id(instance.entity_id, company_id)
            if not po:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Purchase order not found for approval amount check",
                )
            return (
                po.base_amount
                if po.base_amount is not None
                else po.total_amount
            )
        if instance.entity_type == EntityTypeEnum.INVOICE:
            invoice = self.invoice_repo.get_by_id(instance.entity_id, company_id)
            if not invoice:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invoice not found for approval amount check",
                )
            return (
                invoice.base_amount
                if invoice.base_amount is not None
                else invoice.total_amount
            )
        if instance.entity_type == EntityTypeEnum.PAYMENT:
            payment = self.payment_repo.get_by_id(instance.entity_id, company_id)
            if not payment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Payment not found for approval amount check",
                )
            return (
                payment.base_amount
                if payment.base_amount is not None
                else payment.amount
            )

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported entity type for approval amount check",
        )

    def _apply_workflow_progression(
        self,
        instance,
        current_level,
        company_id: UUID,
        actor_user_id: UUID,
    ) -> None:
        actions = self.action_repo.get_by_instance(instance.id, company_id)

        current_level_actions = [
            action for action in actions if action.level_id == current_level.id
        ]

        if any(action.action == ActionType.REJECTED for action in current_level_actions):
            instance.status = ApprovalStatus.REJECTED
            instance.current_level_id = None
            self.instance_repo.update(instance)

            self._sync_entity_status(
                instance=instance,
                company_id=company_id,
                approved=False,
                actor_user_id=actor_user_id,
            )
            return

        required_role_ids = {
            level_role.role_id
            for level_role in self.level_role_repo.get_by_level(
                current_level.id,
                company_id,
            )
        }

        approved_role_ids = set()

        for action in current_level_actions:
            if action.action != ActionType.APPROVED:
                continue

            action_user_role_id = getattr(action.user, "role_id", None)

            if action_user_role_id in required_role_ids:
                approved_role_ids.add(action_user_role_id)

        if not required_role_ids.issubset(approved_role_ids):
            return

        approval_amount = self._get_entity_approval_amount(
            instance=instance,
            company_id=company_id,
        )

        if current_level.max_amount is None or approval_amount <= current_level.max_amount:
            instance.status = ApprovalStatus.APPROVED
            instance.current_level_id = None
            self.instance_repo.update(instance)

            self._sync_entity_status(
                instance=instance,
                company_id=company_id,
                approved=True,
                actor_user_id=actor_user_id,
            )
            return

        next_level = self.workflow_level_repo.get_next_level(
            workflow_id=instance.workflow_id,
            current_level_order=current_level.level_order,
            company_id=company_id,
        )

        if next_level:
            instance.current_level_id = next_level.id
            self.instance_repo.update(instance)
            return

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No approval level is configured for this amount.",
        )

        

    def _sync_entity_status(
        self,
        instance,
        company_id: UUID,
        approved: bool,
        actor_user_id: UUID,
    ) -> None:
        if instance.entity_type == EntityTypeEnum.PR:
            requisition = self.pr_repo.get_by_id(instance.entity_id, company_id)
            if not requisition:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Purchase requisition not found for approval sync",
                )

            old_status = requisition.status

            requisition.status = (
                PRStatusEnum.APPROVED if approved else PRStatusEnum.REJECTED
            )
            self.pr_repo.update(requisition)

            # AUDIT LOG
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="PR",
                entity_id=requisition.id,
                action="PR_APPROVED" if approved else "PR_REJECTED",
                actor_user_id=actor_user_id,
                description=(
                    f"Purchase requisition {requisition.pr_number} approved"
                    if approved
                    else f"Purchase requisition {requisition.pr_number} rejected"
                ),
                old_values_json={
                    "status": enum_value(old_status),
                },
                new_values_json={
                    "status": enum_value(requisition.status),
                },
            )
            return

        if instance.entity_type == EntityTypeEnum.PO:
            po = self.po_repo.get_by_id(instance.entity_id, company_id)
            if not po:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Purchase order not found for approval sync",
                )
            
            old_status = po.status

            po.status = POStatusEnum.APPROVED if approved else POStatusEnum.REJECTED
            self.po_repo.update(po)

            # AUDIT LOG
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="PO",
                entity_id=po.id,
                action="PO_APPROVED" if approved else "PO_REJECTED",
                actor_user_id=actor_user_id,
                description=(
                    f"Purchase order {po.po_number} approved"
                    if approved
                    else f"Purchase order {po.po_number} rejected"
                ),
                old_values_json={
                    "status": enum_value(old_status),
                },
                new_values_json={
                    "status": enum_value(po.status),
                },
            )
            return

        if instance.entity_type == EntityTypeEnum.INVOICE:
            invoice = self.invoice_repo.get_by_id(instance.entity_id, company_id)
            if not invoice:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invoice not found for approval sync",
                )

            old_status = invoice.status

            invoice.status = (
                InvoiceStatusEnum.APPROVED
                if approved
                else InvoiceStatusEnum.REJECTED
            )
            self.invoice_repo.update(invoice)

            # AUDIT LOG
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="INVOICE",
                entity_id=invoice.id,
                action="INVOICE_APPROVED" if approved else "INVOICE_REJECTED",
                actor_user_id=actor_user_id,
                description=(
                    f"Invoice {invoice.invoice_number} approved"
                if approved
                    else f"Invoice {invoice.invoice_number} rejected"
                ),
                old_values_json={
                    "status": enum_value(old_status),
                },
                new_values_json={
                    "status": enum_value(invoice.status),
                },
            ) 

            return

        if instance.entity_type == EntityTypeEnum.PAYMENT:
            payment = self.payment_repo.get_by_id(instance.entity_id, company_id)
            if not payment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Payment not found for approval sync",
                )

            old_payment_status = payment.status

            payment.status = (
                PaymentStatusEnum.COMPLETED
                if approved
                else PaymentStatusEnum.REJECTED
            )
            self.payment_repo.update(payment)

            # AUDIT LOG
            self.audit_log_service.log_action(
                company_id=company_id,
                entity_type="PAYMENT",
                entity_id=payment.id,
                action="PAYMENT_APPROVED" if approved else "PAYMENT_REJECTED",
                actor_user_id=actor_user_id,
                description=(
                    f"Payment {payment.id} approved and completed"
                    if approved
                    else f"Payment {payment.id} rejected"
                ),
                old_values_json={
                    "status": enum_value(old_payment_status),
                },
                new_values_json={
                    "status": enum_value(payment.status),
                },
            )

            if approved:
                invoice = self.invoice_repo.get_by_id(payment.invoice_id, company_id)
                if not invoice:
                    raise HTTPException(
                        status_code=status.HTTP_404_NOT_FOUND,
                        detail="Invoice not found for payment sync",
                    )

                total_paid = self.payment_repo.get_total_paid(
                    invoice_id=invoice.id,
                    company_id=company_id,
                )

                if total_paid >= invoice.total_amount:
                    invoice.status = InvoiceStatusEnum.PAID
                else:
                    invoice.status = InvoiceStatusEnum.PARTIALLY_PAID

                self.invoice_repo.update(invoice)

            return

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported entity type for approval status sync",
        )