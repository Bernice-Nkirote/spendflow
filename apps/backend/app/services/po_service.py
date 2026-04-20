from datetime import datetime, timezone
from decimal import Decimal
from uuid import UUID, uuid4

from fastapi import HTTPException, status

from app.models.enums import EntityTypeEnum, POStatusEnum, PRStatusEnum
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.po_item_repository import PurchaseOrderItemRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.pr_item_repository import PurchaseRequisitionItemRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.schemas.approval_instance_schema import ApprovalInstanceCreate
from app.services.approval_instance_service import ApprovalInstanceService


class PurchaseOrderService:
    def __init__(
        self,
        po_repo: PurchaseOrderRepository,
        po_item_repo: PurchaseOrderItemRepository,
        pr_repo: PurchaseRequisitionRepository,
        pr_item_repo: PurchaseRequisitionItemRepository,
        workflow_repo: ApprovalWorkflowRepository,
        approval_instance_service: ApprovalInstanceService,
    ):
        self.po_repo = po_repo
        self.po_item_repo = po_item_repo
        self.pr_repo = pr_repo
        self.pr_item_repo = pr_item_repo
        self.workflow_repo = workflow_repo
        self.approval_instance_service = approval_instance_service

    def _normalize_currency(self, currency: str | None) -> str:
        if not currency:
            return "KES"
        normalized = currency.strip().upper()
        if not normalized:
            return "KES"
        return normalized

    def _generate_po_number(self, company_id: UUID) -> str:
        while True:
            timestamp = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S%f")
            suffix = uuid4().hex[:6].upper()
            po_number = f"PO-{timestamp}-{suffix}"

            existing_po = self.po_repo.get_by_po_number(po_number, company_id)
            if not existing_po:
                return po_number

    def _validate_item_values(
        self,
        item_name: str,
        quantity: Decimal,
        unit_price: Decimal,
    ) -> None:
        if not item_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item name is required",
            )

        if quantity <= Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item quantity must be greater than zero",
            )

        if unit_price < Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item unit price cannot be negative",
            )

    def _validate_item_fields(self, item_data) -> None:
        item_name = getattr(item_data, "item_name", None)
        quantity = getattr(item_data, "quantity", None)
        unit_price = getattr(item_data, "unit_price", None)

        if item_name is None or quantity is None or unit_price is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item name, quantity, and unit price are required",
            )

        self._validate_item_values(
            item_name=str(item_name),
            quantity=Decimal(quantity),
            unit_price=Decimal(unit_price),
        )

    def _calculate_item_total(
        self,
        quantity: Decimal,
        unit_price: Decimal,
    ) -> Decimal:
        return quantity * unit_price

    def _calculate_po_total(self, items) -> Decimal:
        total = Decimal("0.00")
        for item in items:
            total += item.total_price
        return total

    def _recalculate_po_total(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.po_repo.get_by_id(po_id, company_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )

        items = self.po_item_repo.get_all_by_po(po_id, company_id)
        po.total_amount = self._calculate_po_total(items)
        return self.po_repo.update(po)

    def _create_po_items(
        self,
        po_id: UUID,
        company_id: UUID,
        items_data,
    ) -> None:
        for item_data in items_data:
            self._validate_item_fields(item_data)

            quantity = Decimal(item_data.quantity)
            unit_price = Decimal(item_data.unit_price)
            total_price = self._calculate_item_total(quantity, unit_price)

            item = PurchaseOrderItem(
                company_id=company_id,
                purchase_order_id=po_id,
                item_name=item_data.item_name.strip(),
                description=item_data.description,
                quantity=quantity,
                unit_price=unit_price,
                total_price=total_price,
            )
            self.po_item_repo.create(item)

    def _replace_po_items(
        self,
        po_id: UUID,
        company_id: UUID,
        items_data,
    ) -> None:
        existing_items = self.po_item_repo.get_all_by_po(po_id, company_id)
        for item in existing_items:
            self.po_item_repo.delete(item)

        self._create_po_items(po_id, company_id, items_data)

    def _extract_pr_item_values(
        self,
        pr_item,
    ) -> tuple[str, str | None, Decimal, Decimal]:
        item_name = getattr(pr_item, "item_name", None)
        description = getattr(pr_item, "description", None)
        quantity = getattr(pr_item, "quantity", None)
        unit_price = getattr(pr_item, "unit_price", None)

        if not item_name or not str(item_name).strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PR item name is required for PO creation",
            )

        if quantity is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PR item quantity is required for PO creation",
            )

        if unit_price is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PR item unit price is required for PO creation",
            )

        quantity_decimal = Decimal(quantity)
        unit_price_decimal = Decimal(unit_price)

        if quantity_decimal <= Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PR item quantity must be greater than zero",
            )

        if unit_price_decimal < Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PR item unit price cannot be negative",
            )

        return (
            str(item_name).strip(),
            description,
            quantity_decimal,
            unit_price_decimal,
        )

    def create_po(
        self,
        po_data,
        company_id: UUID,
        created_by: UUID,
    ) -> PurchaseOrder:
        if not po_data.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier id is required",
            )

        if not po_data.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one purchase order item is required",
            )

        po = PurchaseOrder(
            po_number=self._generate_po_number(company_id),
            company_id=company_id,
            created_by=created_by,
            supplier_id=po_data.supplier_id,
            department_id=po_data.department_id,
            status=POStatusEnum.DRAFT,
            total_amount=Decimal("0.00"),
            currency=self._normalize_currency(po_data.currency),
            notes=po_data.notes,
        )

        created_po = self.po_repo.create(po)
        self._create_po_items(created_po.id, company_id, po_data.items)
        return self._recalculate_po_total(created_po.id, company_id)

    def create_po_from_pr(
        self,
        requisition_id: UUID,
        po_data,
        company_id: UUID,
        created_by: UUID,
    ) -> PurchaseOrder:
        if not po_data.supplier_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier id is required",
            )

        requisition = self.pr_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found",
            )

        if requisition.status != PRStatusEnum.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved purchase requisitions can be converted to purchase orders",
            )

        existing_po = self.po_repo.get_by_purchase_requisition_id(
            requisition_id,
            company_id,
        )
        if existing_po:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This purchase requisition has already been converted to a purchase order",
            )

        requisition_items = self.pr_item_repo.get_by_requisition_id(
            requisition_id,
            company_id,
        )
        if not requisition_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase requisition must have at least one item before conversion",
            )

        po = PurchaseOrder(
            po_number=self._generate_po_number(company_id),
            company_id=company_id,
            created_by=created_by,
            supplier_id=po_data.supplier_id,
            department_id=po_data.department_id or requisition.department_id,
            purchase_requisition_id=requisition.id,
            status=POStatusEnum.DRAFT,
            total_amount=Decimal("0.00"),
            currency=self._normalize_currency(po_data.currency or requisition.currency),
            notes=po_data.notes,
        )

        created_po = self.po_repo.create(po)

        for requisition_item in requisition_items:
            item_name, description, quantity, unit_price = self._extract_pr_item_values(
                requisition_item
            )

            item = PurchaseOrderItem(
                company_id=company_id,
                purchase_order_id=created_po.id,
                item_name=item_name,
                description=description,
                quantity=quantity,
                unit_price=unit_price,
                total_price=self._calculate_item_total(quantity, unit_price),
            )
            self.po_item_repo.create(item)

        self.pr_repo.update(
            requisition,
            {"status": PRStatusEnum.CONVERTED_TO_PO},
        )

        return self._recalculate_po_total(created_po.id, company_id)

    def get_po(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.po_repo.get_by_id(po_id, company_id)
        if not po:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order not found",
            )
        return po

    def get_all_pos(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseOrder]:
        return self.po_repo.get_all(company_id, skip, limit)

    def get_all_pos_by_status(
        self,
        po_status: POStatusEnum,
        company_id: UUID,
    ) -> list[PurchaseOrder]:
        return self.po_repo.get_by_status(po_status, company_id)

    def update_po(
        self,
        po_id: UUID,
        po_data,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can be updated",
            )

        if po_data.supplier_id is not None:
            po.supplier_id = po_data.supplier_id

        if po_data.department_id is not None:
            po.department_id = po_data.department_id

        if po_data.currency is not None:
            po.currency = self._normalize_currency(po_data.currency)

        if po_data.notes is not None:
            po.notes = po_data.notes

        updated_po = self.po_repo.update(po)

        if po_data.items is not None:
            if not po_data.items:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Purchase order must have at least one item",
                )
            self._replace_po_items(updated_po.id, company_id, po_data.items)
            return self._recalculate_po_total(updated_po.id, company_id)

        return updated_po

    def create_po_item(
        self,
        po_id: UUID,
        item_data,
        company_id: UUID,
    ) -> PurchaseOrderItem:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can accept item changes",
            )

        self._validate_item_fields(item_data)

        quantity = Decimal(item_data.quantity)
        unit_price = Decimal(item_data.unit_price)

        item = PurchaseOrderItem(
            company_id=company_id,
            purchase_order_id=po.id,
            item_name=item_data.item_name.strip(),
            description=item_data.description,
            quantity=quantity,
            unit_price=unit_price,
            total_price=self._calculate_item_total(quantity, unit_price),
        )

        created_item = self.po_item_repo.create(item)
        self._recalculate_po_total(po.id, company_id)
        return created_item

    def get_all_po_items(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> list[PurchaseOrderItem]:
        self.get_po(po_id, company_id)
        return self.po_item_repo.get_all_by_po(po_id, company_id)

    def update_po_item(
        self,
        po_id: UUID,
        item_id: UUID,
        item_data,
        company_id: UUID,
    ) -> PurchaseOrderItem:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can accept item changes",
            )

        item = self.po_item_repo.get_by_id(item_id, company_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order item not found",
            )

        if item.purchase_order_id != po.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item does not belong to this purchase order",
            )

        item_name = item_data.item_name if item_data.item_name is not None else item.item_name
        description = item_data.description if item_data.description is not None else item.description
        quantity = Decimal(item_data.quantity) if item_data.quantity is not None else item.quantity
        unit_price = Decimal(item_data.unit_price) if item_data.unit_price is not None else item.unit_price

        self._validate_item_values(
            item_name=str(item_name),
            quantity=quantity,
            unit_price=unit_price,
        )

        item.item_name = str(item_name).strip()
        item.description = description
        item.quantity = quantity
        item.unit_price = unit_price
        item.total_price = self._calculate_item_total(quantity, unit_price)

        updated_item = self.po_item_repo.update(item)
        self._recalculate_po_total(po.id, company_id)
        return updated_item

    def delete_po_item(
        self,
        po_id: UUID,
        item_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrderItem:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can accept item changes",
            )

        item = self.po_item_repo.get_by_id(item_id, company_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase order item not found",
            )

        if item.purchase_order_id != po.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item does not belong to this purchase order",
            )

        remaining_items = self.po_item_repo.get_all_by_po(po.id, company_id)
        if len(remaining_items) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order must have at least one item",
            )

        self.po_item_repo.delete(item)
        self._recalculate_po_total(po.id, company_id)
        return item

    def submit_po(
        self,
        po_id: UUID,
        company_id: UUID,
        submitted_by: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can be submitted",
            )

        items = self.po_item_repo.get_all_by_po(po.id, company_id)
        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order must have at least one item",
            )

        workflow = self.workflow_repo.get_active_by_entity_type(
            entity_type=EntityTypeEnum.PO,
            company_id=company_id,
        )
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active approval workflow configured for purchase orders",
            )

        self.approval_instance_service.create_instance(
            ApprovalInstanceCreate(
                workflow_id=workflow.id,
                entity_id=po.id,
                entity_type=EntityTypeEnum.PO,
            ),
            company_id=company_id,
        )

        po.submitted_by = submitted_by
        po.submitted_at = datetime.now(timezone.utc)
        po.status = POStatusEnum.PENDING_APPROVAL
        return self.po_repo.update(po)

    def approve_po(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.PENDING_APPROVAL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending approval purchase orders can be approved",
            )

        po.status = POStatusEnum.APPROVED
        return self.po_repo.update(po)

    def reject_po(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.PENDING_APPROVAL:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending approval purchase orders can be rejected",
            )

        po.status = POStatusEnum.REJECTED
        return self.po_repo.update(po)

    def issue_po(
        self,
        po_id: UUID,
        company_id: UUID,
        issued_by: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved purchase orders can be issued",
            )

        po.issued_by = issued_by
        po.issued_at = datetime.now(timezone.utc)
        po.status = POStatusEnum.SENT
        return self.po_repo.update(po)

    def mark_po_partially_received(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status not in {POStatusEnum.SENT, POStatusEnum.PARTIALLY_RECEIVED}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only sent or partially received purchase orders can be marked as sent or partially received",
            )

        po.status = POStatusEnum.PARTIALLY_RECEIVED
        return self.po_repo.update(po)

    def receive_po(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status not in {POStatusEnum.SENT, POStatusEnum.PARTIALLY_RECEIVED}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only sent or partially received purchase orders can be marked as received",
            )

        po.status = POStatusEnum.RECEIVED
        return self.po_repo.update(po)

    def cancel_po(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status not in {
            POStatusEnum.DRAFT,
            POStatusEnum.PENDING_APPROVAL,
            POStatusEnum.REJECTED,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This purchase order cannot be cancelled",
            )

        po.status = POStatusEnum.CANCELLED
        return self.po_repo.update(po)

    def delete_po(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase orders can be deleted",
            )

        self.po_repo.delete(po)
        return po