from decimal import Decimal
from typing import Any
from uuid import UUID
from datetime import datetime
import uuid

from fastapi import HTTPException, status

from app.models.approval_instance import ApprovalInstance
from app.models.enums import ApprovalStatus, EntityTypeEnum, InvoiceStatusEnum
from app.models.invoice import Invoice
from app.models.invoice_line_item import InvoiceLineItem
from app.repositories.invoice_line_item_repository import InvoiceLineItemRepository
from app.repositories.invoice_repository import InvoiceRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository

from app.schemas.invoice_line_item_schema import (
    InvoiceLineItemCreate,
    InvoiceLineItemUpdate,
)
from app.schemas.invoice_schema import InvoiceCreate, InvoiceUpdate
from app.services.permission_service import PermissionService
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.audit_log_service import AuditLogService
from app.utils.value_helper.enum_utils import enum_value

class InvoiceService:
    def __init__(
        self,
        invoice_repo: InvoiceRepository,
        line_item_repo: InvoiceLineItemRepository,
        purchase_order_repo: PurchaseOrderRepository,
        workflow_repo: ApprovalWorkflowRepository,
        approval_instance_service: ApprovalInstanceService,
        permission_service: PermissionService,
        audit_log_service: AuditLogService,
    ):
        self.invoice_repo = invoice_repo
        self.line_item_repo = line_item_repo
        self.purchase_order_repo = purchase_order_repo
        self.workflow_repo = workflow_repo
        self.approval_instance_service = approval_instance_service
        self.permission_service = permission_service
        self.audit_log_service = audit_log_service

    def _generate_invoice_number(self) -> str:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S%f")
        suffix = uuid.uuid4().hex[:6].upper()
        return f"INV-{timestamp}-{suffix}"

    def create_invoice(
        self,
        invoice_data: InvoiceCreate,
        company_id: UUID,
        submitting_user: Any,
        role_id: UUID | None = None,
    ) -> Invoice:
        # PERMISSION CHECK
        if not hasattr(submitting_user, "supplier_id"):
            if not self.permission_service.role_has_permission(
                role_id=role_id,
                permission_name="invoice.create",
                company_id=company_id,
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to create invoices",
                )
            
        invoice_number = (
            invoice_data.invoice_number.strip()
            if invoice_data.invoice_number
            else self._generate_invoice_number()
        )

        if not invoice_data.line_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one invoice line item is required",
            )

        if not invoice_data.purchase_order_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order is required for this invoice flow",
            )

        existing_invoice = self.invoice_repo.get_by_invoice_number(
            invoice_number=invoice_number,
            company_id=company_id,
        )
        if existing_invoice:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Invoice number already exists",
            )

        po = self.purchase_order_repo.get_by_id(
            po_id=invoice_data.purchase_order_id,
            company_id=company_id,
        )
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )

        po_status = getattr(po.status, "value", str(po.status))
        if po_status not in {"APPROVED", "SENT"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot create invoice for a purchase order that is not approved or sent",
            )

        submitted_by_user_id = None
        submitted_by_supplier_user_id = None

        if hasattr(submitting_user, "supplier_id"):
            submitted_by_supplier_user_id = submitting_user.id

            if submitting_user.supplier_id != po.supplier_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You cannot invoice another supplier's purchase order",
                )

            supplier_id = po.supplier_id
        else:
            submitted_by_user_id = submitting_user.id
            supplier_id = invoice_data.supplier_id

            if supplier_id != po.supplier_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invoice supplier must match the purchase order supplier",
                )
        
        invoice = Invoice(
            company_id=company_id,
            purchase_order_id=po.id,
            supplier_id=supplier_id,
            submitted_by_user_id=submitted_by_user_id,
            submitted_by_supplier_user_id=submitted_by_supplier_user_id,
            invoice_number=invoice_number,
            total_amount=Decimal("0.00"),
            status=InvoiceStatusEnum.DRAFT,
        )

        created_invoice = self.invoice_repo.create(invoice)

        total_amount = Decimal("0.00")
        existing_invoices = self.invoice_repo.get_by_purchase_order_id(
            purchase_order_id=po.id,
            company_id=company_id,
        )

        for item in invoice_data.line_items:
            description = item.description.strip()
            if not description:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Line item description is required",
                )

            po_item = next(
                (
                    po_item
                    for po_item in po.items
                    if po_item.id == item.purchase_order_item_id
                ),
                None,
            )
            if not po_item:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Purchase order item {item.purchase_order_item_id} "
                        "is invalid for this purchase order"
                    ),
                )

            already_invoiced_qty = Decimal("0.00")

            for existing_invoice in existing_invoices:
                if existing_invoice.id == created_invoice.id:
                    continue

                existing_line_items = self.line_item_repo.get_all_by_invoice(
                    invoice_id=existing_invoice.id,
                    company_id=company_id,
                )

                for existing_line_item in existing_line_items:
                    if (
                        existing_line_item.purchase_order_item_id
                        == item.purchase_order_item_id
                    ):
                        already_invoiced_qty += existing_line_item.invoiced_quantity

            if item.invoiced_quantity + already_invoiced_qty > po_item.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Over-invoicing is not allowed",
                )

            total_price = item.invoiced_quantity * item.unit_price

            line_item = InvoiceLineItem(
                company_id=company_id,
                invoice_id=created_invoice.id,
                purchase_order_item_id=item.purchase_order_item_id,
                description=description,
                invoiced_quantity=item.invoiced_quantity,
                unit_price=item.unit_price,
                total_price=total_price,
            )

            self.line_item_repo.create(line_item)
            total_amount += total_price

        created_invoice.total_amount = total_amount

        updated_invoice = self.invoice_repo.update(created_invoice)
        
        # AUDIT LOG CHECK
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="INVOICE",
            entity_id=updated_invoice.id,
            action="INVOICE_CREATED",
            actor_user_id=submitted_by_user_id,
            actor_supplier_user_id=submitted_by_supplier_user_id,
            description=f"Invoice {updated_invoice.invoice_number} created",
            new_values_json={
                "invoice_number": updated_invoice.invoice_number,
                "purchase_order_id": str(updated_invoice.purchase_order_id),
                "supplier_id": str(updated_invoice.supplier_id),
                "total_amount": str(updated_invoice.total_amount),
                "status": enum_value(updated_invoice.status),
            },
        )
        
        self.invoice_repo.db.commit()
        self.invoice_repo.db.refresh(updated_invoice)

        return updated_invoice

    def get_invoice(
        self,
        invoice_id: UUID,
        company_id: UUID,
    ) -> Invoice:
        invoice = self.invoice_repo.get_by_id(
            invoice_id=invoice_id,
            company_id=company_id,
        )

        if not invoice:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invoice not found",
            )

        invoice.line_items = self.line_item_repo.get_all_by_invoice(
            invoice_id=invoice.id,
            company_id=company_id,
        )

        invoice.supplier_name = invoice.supplier.name if invoice.supplier else None

        invoice.po_number = (
            invoice.purchase_order.po_number
            if invoice.purchase_order
            else None
        )

        invoice.submitted_by_user_name = (
            invoice.submitted_by_user.name
            if invoice.submitted_by_user
            else None
        )

        invoice.submitted_by_supplier_user_name = (
            invoice.submitted_by_supplier_user.name
            if invoice.submitted_by_supplier_user
            else None
        )

        return invoice

    def get_all_invoices(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Invoice]:
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

        return self.invoice_repo.get_all(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def get_all_invoices_by_status(
        self,
        invoice_status: InvoiceStatusEnum,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Invoice]:
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

        return self.invoice_repo.get_by_status(
            status=invoice_status,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def get_all_invoices_by_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[Invoice]:
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

        return self.invoice_repo.get_by_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def get_all_invoices_by_purchase_order(
        self,
        purchase_order_id: UUID,
        company_id: UUID,
    ) -> list[Invoice]:
        po = self.purchase_order_repo.get_by_id(
            po_id=purchase_order_id,
            company_id=company_id,
        )
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )

        return self.invoice_repo.get_by_purchase_order_id(
            purchase_order_id=purchase_order_id,
            company_id=company_id,
        )

    def update_invoice(
        self,
        invoice_id: UUID,
        invoice_data: InvoiceUpdate,
        company_id: UUID,
        actor_user_id: UUID | None = None,
        actor_supplier_user_id: UUID | None = None,
    ) -> Invoice:
        invoice = self.get_invoice(invoice_id, company_id)

        self._ensure_invoice_is_editable(invoice)

        old_values = {
            "invoice_number": invoice.invoice_number,
            "total_amount": str(invoice.total_amount),
            "status": enum_value(invoice.status),
        }

        update_data = invoice_data.model_dump(exclude_unset=True)

        if "invoice_number" in update_data:
            invoice_number = update_data["invoice_number"].strip()
            if not invoice_number:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invoice number cannot be empty",
                )

            existing_invoice = self.invoice_repo.get_by_invoice_number(
                invoice_number=invoice_number,
                company_id=company_id,
            )
            if existing_invoice and existing_invoice.id != invoice.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Invoice number already exists",
                )

            update_data["invoice_number"] = invoice_number

        if (
            "purchase_order_id" in update_data
            and update_data["purchase_order_id"] != invoice.purchase_order_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Changing purchase order is not allowed",
            )

        if (
            "supplier_id" in update_data
            and update_data["supplier_id"] != invoice.supplier_id
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Changing supplier is not allowed",
            )

        if "line_items" in update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice line items cannot be updated through this method",
            )

        if "status" in update_data and update_data["status"] != invoice.status:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice status cannot be updated through this method",
            )

        for field, value in update_data.items():
            setattr(invoice, field, value)

        updated_invoice = self.invoice_repo.update(invoice)
        # AUDIT LOG 
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="INVOICE",
            entity_id=invoice.id,
            action="INVOICE_UPDATED",
            actor_user_id=actor_user_id,
            actor_supplier_user_id=actor_supplier_user_id,
            description=f"Invoice {invoice.invoice_number} updated",
            old_values_json=old_values,
            new_values_json=update_data,
        )

        self.invoice_repo.db.commit()
        self.invoice_repo.db.refresh(updated_invoice)

        return updated_invoice

    def submit_invoice(
        self,
        invoice_id: UUID,
        company_id: UUID,
        role_id: UUID |None = None,
        actor_user_id: UUID | None = None,
        actor_supplier_user_id: UUID |None = None,
    ) -> Invoice:
        invoice = self.get_invoice(invoice_id, company_id)

        # internal users only
        if invoice.submitted_by_user_id:
            if not self.permission_service.role_has_permission(
                role_id=role_id,
                permission_name="invoice.submit",
                company_id=company_id,
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to submit invoices",
                )
        status_value = getattr(invoice.status, "value", str(invoice.status))
        if status_value != InvoiceStatusEnum.DRAFT.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft invoices can be submitted",
            )

        line_items = self.line_item_repo.get_all_by_invoice(
            invoice_id=invoice.id,
            company_id=company_id,
        )
        if not line_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice must have at least one line item before submission",
            )

        if invoice.total_amount is None or invoice.total_amount <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice total amount must be greater than zero before submission",
            )

        workflow = self.workflow_repo.get_active_by_entity_type(
            entity_type=EntityTypeEnum.INVOICE,
            company_id=company_id,
        )
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active approval workflow found for invoices",
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
            entity_id=invoice.id,
            entity_type=EntityTypeEnum.INVOICE,
            company_id=company_id,
        )
        if existing_pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending approval instance already exists for this invoice",
            )

        approval_instance = ApprovalInstance(
            company_id=company_id,
            workflow_id=workflow.id,
            entity_id=invoice.id,
            entity_type=EntityTypeEnum.INVOICE,
            current_level_id=first_level.id,
            status=ApprovalStatus.PENDING,
        )

        self.approval_instance_service.repo.create(approval_instance)

        invoice.status = InvoiceStatusEnum.PENDING_APPROVAL

        updated_invoice = self.invoice_repo.update(invoice)

        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="INVOICE",
            entity_id=invoice.id,
            action="INVOICE_SUBMITTED",
            actor_user_id=actor_user_id,
            actor_supplier_user_id=actor_supplier_user_id,
            description=f"Invoice {invoice.invoice_number} submitted for approval",
            old_values_json={
                "status": InvoiceStatusEnum.DRAFT.value,
            },
            new_values_json={
                "status": InvoiceStatusEnum.PENDING_APPROVAL.value,
            },
        )
   
        self.invoice_repo.db.commit()
        self.invoice_repo.db.refresh(updated_invoice)

        return updated_invoice

    def delete_invoice(
        self,
        invoice_id: UUID,
        company_id: UUID,
        role_id: UUID |None = None,
        actor_user_id: UUID | None = None,
        actor_supplier_user_id: UUID | None = None,
    ) -> None:
        invoice = self.get_invoice(invoice_id, company_id)
        if invoice.submitted_by_user_id:
            if not self.permission_service.role_has_permission(
                role_id=role_id,
                permission_name="invoice.cancel",
                company_id=company_id,
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to delete invoices",
                )
        status_value = getattr(invoice.status, "value", str(invoice.status))
        if status_value != InvoiceStatusEnum.DRAFT.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft invoices can be deleted",
            )

        # AUDIT LOG CHECK
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="INVOICE",
            entity_id=invoice.id,
            action="INVOICE_CANCELLED",
            actor_user_id=actor_user_id,
            actor_supplier_user_id=actor_supplier_user_id,
            description=f"Invoice {invoice.invoice_number} cancelled",
            old_values_json={
                "invoice_number": invoice.invoice_number,
                "status": enum_value(invoice.status),
                "total_amount": str(invoice.total_amount),
            },
        )
        self.invoice_repo.delete(invoice)
        self.invoice_repo.db.commit()

    def create_invoice_line_item(
        self,
        invoice_id: UUID,
        item_data: InvoiceLineItemCreate,
        company_id: UUID,
    ) -> InvoiceLineItem:
        invoice = self.get_invoice(invoice_id, company_id)

        self._ensure_invoice_is_editable(invoice)

        po = self.purchase_order_repo.get_by_id(
            po_id=invoice.purchase_order_id,
            company_id=company_id,
        )
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )

        description = item_data.description.strip()
        if not description:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Description is required",
            )

        po_item = next(
            (item for item in po.items if item.id == item_data.purchase_order_item_id),
            None,
        )
        if not po_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid purchase order item",
            )

        existing_invoices = self.invoice_repo.get_by_purchase_order_id(
            purchase_order_id=po.id,
            company_id=company_id,
        )

        already_invoiced_qty = Decimal("0.00")
        for existing_invoice in existing_invoices:
            items = self.line_item_repo.get_all_by_invoice(
                invoice_id=existing_invoice.id,
                company_id=company_id,
            )

            for line_item in items:
                if line_item.purchase_order_item_id == item_data.purchase_order_item_id:
                    already_invoiced_qty += line_item.invoiced_quantity

        if item_data.invoiced_quantity + already_invoiced_qty > po_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Over-invoicing is not allowed",
            )

        total_price = item_data.invoiced_quantity * item_data.unit_price

        line_item = InvoiceLineItem(
            company_id=company_id,
            invoice_id=invoice.id,
            purchase_order_item_id=item_data.purchase_order_item_id,
            description=description,
            invoiced_quantity=item_data.invoiced_quantity,
            unit_price=item_data.unit_price,
            total_price=total_price,
        )

        created_item = self.line_item_repo.create(line_item)
        self._recalculate_invoice_total(invoice, company_id)

        self.line_item_repo.db.commit()
        self.line_item_repo.db.refresh(created_item)

        return created_item

    def get_all_invoice_line_items(
        self,
        invoice_id: UUID,
        company_id: UUID,
    ) -> list[InvoiceLineItem]:
        invoice = self.get_invoice(invoice_id, company_id)

        return self.line_item_repo.get_all_by_invoice(
            invoice_id=invoice.id,
            company_id=company_id,
        )

    def update_invoice_line_item(
        self,
        item_id: UUID,
        item_data: InvoiceLineItemUpdate,
        company_id: UUID,
    ) -> InvoiceLineItem:
        item = self.line_item_repo.get_by_id(
            line_item_id=item_id,
            company_id=company_id,
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Line item not found",
            )

        invoice = self.get_invoice(item.invoice_id, company_id)

        self._ensure_invoice_is_editable(invoice)

        po = self.purchase_order_repo.get_by_id(
            po_id=invoice.purchase_order_id,
            company_id=company_id,
        )
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )

        update_data = item_data.model_dump(exclude_unset=True)

        if "description" in update_data:
            description = update_data["description"].strip()
            if not description:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Description cannot be empty",
                )

            update_data["description"] = description

        if "purchase_order_item_id" in update_data:
            if update_data["purchase_order_item_id"] != item.purchase_order_item_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Changing purchase order item is not allowed",
                )

        po_item = next(
            (po_item for po_item in po.items if po_item.id == item.purchase_order_item_id),
            None,
        )
        if not po_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid purchase order item",
            )

        quantity = update_data.get("invoiced_quantity", item.invoiced_quantity)
        price = update_data.get("unit_price", item.unit_price)

        existing_invoices = self.invoice_repo.get_by_purchase_order_id(
            purchase_order_id=po.id,
            company_id=company_id,
        )

        already_invoiced_qty = Decimal("0.00")
        for existing_invoice in existing_invoices:
            items = self.line_item_repo.get_all_by_invoice(
                invoice_id=existing_invoice.id,
                company_id=company_id,
            )

            for line_item in items:
                if line_item.id == item.id:
                    continue

                if line_item.purchase_order_item_id == item.purchase_order_item_id:
                    already_invoiced_qty += line_item.invoiced_quantity

        if quantity + already_invoiced_qty > po_item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Over-invoicing is not allowed",
            )

        update_data["total_price"] = quantity * price

        for field, value in update_data.items():
            setattr(item, field, value)

        updated_item = self.line_item_repo.update(item)
        self._recalculate_invoice_total(invoice, company_id)

        self.line_item_repo.db.commit()
        self.line_item_repo.db.refresh(updated_item)

        return updated_item

    def delete_invoice_line_item(
        self,
        item_id: UUID,
        company_id: UUID,
    ) -> None:
        item = self.line_item_repo.get_by_id(
            line_item_id=item_id,
            company_id=company_id,
        )
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Line item not found",
            )

        invoice = self.get_invoice(item.invoice_id, company_id)

        self._ensure_invoice_is_editable(invoice)

        self.line_item_repo.delete(item)
        self._recalculate_invoice_total(invoice, company_id)

        self.line_item_repo.db.commit()

    def _recalculate_invoice_total(
        self,
        invoice: Invoice,
        company_id: UUID,
    ) -> None:
        items = self.line_item_repo.get_all_by_invoice(
            invoice_id=invoice.id,
            company_id=company_id,
        )

        invoice.total_amount = sum(
            (item.total_price for item in items),
            Decimal("0.00"),
        )

        self.invoice_repo.update(invoice)

    def _ensure_invoice_is_editable(self, invoice: Invoice) -> None:
        status_value = getattr(invoice.status, "value", str(invoice.status))

        editable_statuses = {
            InvoiceStatusEnum.DRAFT.value,
        }

        if hasattr(InvoiceStatusEnum, "REJECTED"):
            editable_statuses.add(InvoiceStatusEnum.REJECTED.value)

        if status_value not in editable_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invoice is not editable",
            )