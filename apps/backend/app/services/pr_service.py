import uuid
from decimal import Decimal, ROUND_HALF_UP
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import EntityTypeEnum, PRStatusEnum
from app.models.purchase_requisition import PurchaseRequisition
from app.models.purchase_requisition_item import PurchaseRequisitionItem
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.pr_item_repository import PurchaseRequisitionItemRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.schemas.approval_instance_schema import ApprovalInstanceCreate
from app.schemas.pr_schema import PurchaseRequisitionCreate, PurchaseRequisitionUpdate
from app.services.approval_instance_service import ApprovalInstanceService


class PurchaseRequisitionService:
    def __init__(
        self,
        requisition_repo: PurchaseRequisitionRepository,
        item_repo: PurchaseRequisitionItemRepository,
        workflow_repo: ApprovalWorkflowRepository,
        approval_instance_service: ApprovalInstanceService,
    ):
        self.requisition_repo = requisition_repo
        self.item_repo = item_repo
        self.workflow_repo = workflow_repo
        self.approval_instance_service = approval_instance_service

    def _normalize_currency(self, currency: str | None) -> str:
        if not currency:
            return "KES"

        normalized_currency = currency.strip().upper()
        if not normalized_currency:
            return "KES"

        return normalized_currency

    def _normalize_optional_text(self, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip()

    def _validate_item_values(
        self,
        item_name: str,
        description: str,
        quantity: Decimal,
        unit_price: Decimal | None,
    ) -> None:
        if not item_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item name is required.",
            )

        if not description.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item description is required.",
            )

        if quantity <= Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item quantity must be greater than zero.",
            )

        if unit_price is not None and unit_price < Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item unit price cannot be negative.",
            )

    def _validate_requisition_item_input(
        self,
        item,
    ) -> tuple[str, str, Decimal, Decimal | None]:
        item_name = item.item_name.strip()
        description = item.description.strip()
        quantity = item.quantity
        unit_price = item.unit_price

        self._validate_item_values(
            item_name=item_name,
            description=description,
            quantity=quantity,
            unit_price=unit_price,
        )

        return item_name, description, quantity, unit_price

    def _calculate_line_total(
        self,
        quantity: Decimal,
        unit_price: Decimal | None,
    ) -> Decimal | None:
        if unit_price is None:
            return None

        return (quantity * unit_price).quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

    def _recalculate_requisition_total(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> PurchaseRequisition:
        requisition = self.requisition_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found.",
            )

        items = self.item_repo.get_by_requisition_id(requisition_id, company_id)

        total_amount = Decimal("0.00")
        for item in items:
            if item.line_total is not None:
                total_amount += item.line_total

        total_amount = total_amount.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        updated_requisition = self.requisition_repo.update(
            requisition,
            {"total_amount": total_amount},
        )
        updated_requisition.items = items
        return updated_requisition

    def _get_draft_requisition(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> PurchaseRequisition:
        requisition = self.requisition_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found.",
            )

        if requisition.status != PRStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase requisitions can be changed.",
            )

        return requisition

    def create_purchase_requisition(
        self,
        requisition_data: PurchaseRequisitionCreate,
        user_id: UUID,
        company_id: UUID,
    ) -> PurchaseRequisition:
        title = requisition_data.title.strip()
        if not title:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase requisition title is required.",
            )

        if not requisition_data.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one purchase requisition item is required.",
            )

        description = self._normalize_optional_text(requisition_data.description)
        currency = self._normalize_currency(requisition_data.currency)
        pr_number = self._generate_pr_number(company_id)

        total_amount = Decimal("0.00")
        items_to_create: list[PurchaseRequisitionItem] = []

        for item in requisition_data.items:
            item_name, item_description, quantity, unit_price = (
                self._validate_requisition_item_input(item)
            )

            line_total = self._calculate_line_total(quantity, unit_price)
            if line_total is not None:
                total_amount += line_total

            items_to_create.append(
                PurchaseRequisitionItem(
                    id=uuid.uuid4(),
                    company_id=company_id,
                    item_name=item_name,
                    description=item_description,
                    quantity=quantity,
                    unit_price=unit_price,
                    line_total=line_total,
                )
            )

        total_amount = total_amount.quantize(
            Decimal("0.01"),
            rounding=ROUND_HALF_UP,
        )

        requisition = PurchaseRequisition(
            id=uuid.uuid4(),
            company_id=company_id,
            pr_number=pr_number,
            department_id=requisition_data.department_id,
            requested_by=user_id,
            title=title,
            description=description,
            total_amount=total_amount,
            currency=currency,
            status=PRStatusEnum.DRAFT,
            is_active=True,
        )

        created_requisition = self.requisition_repo.create(requisition)

        for item in items_to_create:
            item.requisition_id = created_requisition.id

        created_items = self.item_repo.create_many(items_to_create)
        created_requisition.items = created_items

        return created_requisition

    def get_purchase_requisition(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> PurchaseRequisition:
        requisition = self.requisition_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found.",
            )

        requisition.items = self.item_repo.get_by_requisition_id(
            requisition.id,
            company_id,
        )
        return requisition

    def get_all_purchase_requisitions(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseRequisition]:
        if skip < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Skip must be zero or greater.",
            )

        if limit < 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Limit must be greater than zero.",
            )

        return self.requisition_repo.get_all(company_id, skip=skip, limit=limit)

    def update_purchase_requisition(
        self,
        requisition_id: UUID,
        requisition_data: PurchaseRequisitionUpdate,
        company_id: UUID,
    ) -> PurchaseRequisition:
        requisition = self.requisition_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found.",
            )

        if requisition.status != PRStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase requisitions can be updated.",
            )

        update_data = requisition_data.model_dump(exclude_unset=True)

        if "title" in update_data:
            normalized_title = update_data["title"].strip()
            if not normalized_title:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Purchase requisition title cannot be empty.",
                )
            update_data["title"] = normalized_title

        if "description" in update_data:
            update_data["description"] = self._normalize_optional_text(
                update_data["description"]
            )

        if "currency" in update_data:
            update_data["currency"] = self._normalize_currency(update_data["currency"])

        updated_requisition = self.requisition_repo.update(requisition, update_data)
        updated_requisition.items = self.item_repo.get_by_requisition_id(
            requisition.id,
            company_id,
        )
        return updated_requisition

    def create_purchase_requisition_item(
        self,
        requisition_id: UUID,
        item_data,
        company_id: UUID,
    ) -> PurchaseRequisitionItem:
        requisition = self._get_draft_requisition(requisition_id, company_id)

        item_name, item_description, quantity, unit_price = (
            self._validate_requisition_item_input(item_data)
        )

        line_total = self._calculate_line_total(quantity, unit_price)

        item = PurchaseRequisitionItem(
            id=uuid.uuid4(),
            company_id=company_id,
            requisition_id=requisition.id,
            item_name=item_name,
            description=item_description,
            quantity=quantity,
            unit_price=unit_price,
            line_total=line_total,
        )

        created_item = self.item_repo.create(item)
        self._recalculate_requisition_total(requisition.id, company_id)
        return created_item

    def get_all_purchase_requisition_items(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> list[PurchaseRequisitionItem]:
        requisition = self.requisition_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found.",
            )

        return self.item_repo.get_by_requisition_id(requisition.id, company_id)

    def update_purchase_requisition_item(
        self,
        requisition_id: UUID,
        item_id: UUID,
        item_data,
        company_id: UUID,
    ) -> PurchaseRequisitionItem:
        requisition = self._get_draft_requisition(requisition_id, company_id)

        item = self.item_repo.get_by_id(item_id, company_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition item not found.",
            )

        if item.requisition_id != requisition.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item does not belong to this purchase requisition.",
            )

        item_name = item_data.item_name if item_data.item_name is not None else item.item_name
        description = item_data.description if item_data.description is not None else item.description
        quantity = Decimal(item_data.quantity) if item_data.quantity is not None else item.quantity
        unit_price = Decimal(item_data.unit_price) if item_data.unit_price is not None else item.unit_price

        self._validate_item_values(
            item_name=str(item_name),
            description=str(description),
            quantity=quantity,
            unit_price=unit_price,
        )

        item.item_name = str(item_name).strip()
        item.description = str(description).strip()
        item.quantity = quantity
        item.unit_price = unit_price
        item.line_total = self._calculate_line_total(quantity, unit_price)

        updated_item = self.item_repo.update(
            item,
            {
                "item_name": item.item_name,
                "description": item.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.line_total,
            },
        )
        self._recalculate_requisition_total(requisition.id, company_id)
        return updated_item

    def delete_purchase_requisition_item(
        self,
        requisition_id: UUID,
        item_id: UUID,
        company_id: UUID,
    ) -> PurchaseRequisitionItem:
        requisition = self._get_draft_requisition(requisition_id, company_id)

        item = self.item_repo.get_by_id(item_id, company_id)
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition item not found.",
            )

        if item.requisition_id != requisition.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Item does not belong to this purchase requisition.",
            )

        remaining_items = self.item_repo.get_by_requisition_id(
            requisition.id,
            company_id,
        )
        if len(remaining_items) <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase requisition must have at least one item.",
            )

        self.item_repo.delete(item)
        self._recalculate_requisition_total(requisition.id, company_id)
        return item

    def submit_purchase_requisition(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> PurchaseRequisition:
        requisition = self.requisition_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found.",
            )

        if requisition.status != PRStatusEnum.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only draft purchase requisitions can be submitted.",
            )

        items = self.item_repo.get_by_requisition_id(requisition.id, company_id)
        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase requisition must have at least one item before submission.",
            )

        workflow = self.workflow_repo.get_active_by_entity_type(
            entity_type=EntityTypeEnum.PR,
            company_id=company_id,
        )
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active approval workflow configured for purchase requisitions.",
            )

        self.approval_instance_service.create_instance(
            ApprovalInstanceCreate(
                workflow_id=workflow.id,
                entity_id=requisition.id,
                entity_type=EntityTypeEnum.PR,
            ),
            company_id=company_id,
        )

        updated_requisition = self.requisition_repo.update(
            requisition,
            {"status": PRStatusEnum.PENDING_APPROVAL},
        )
        updated_requisition.items = items
        return updated_requisition

    def cancel_purchase_requisition(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> PurchaseRequisition:
        requisition = self.requisition_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found.",
            )

        if requisition.status in {
            PRStatusEnum.CANCELLED,
            PRStatusEnum.CONVERTED_TO_PO,
        }:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase requisition cannot be cancelled in its current state.",
            )

        updated_requisition = self.requisition_repo.update(
            requisition,
            {"status": PRStatusEnum.CANCELLED},
        )
        updated_requisition.items = self.item_repo.get_by_requisition_id(
            requisition.id,
            company_id,
        )
        return updated_requisition

    def mark_purchase_requisition_converted_to_po(
        self,
        requisition_id: UUID,
        company_id: UUID,
    ) -> PurchaseRequisition:
        requisition = self.requisition_repo.get_by_id(requisition_id, company_id)
        if not requisition:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Purchase requisition not found.",
            )

        if requisition.status != PRStatusEnum.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved purchase requisitions can be marked as converted to PO.",
            )

        updated_requisition = self.requisition_repo.update(
            requisition,
            {"status": PRStatusEnum.CONVERTED_TO_PO},
        )
        updated_requisition.items = self.item_repo.get_by_requisition_id(
            requisition.id,
            company_id,
        )
        return updated_requisition

    def _generate_pr_number(self, company_id: UUID) -> str:
        while True:
            candidate = f"PR-{uuid.uuid4().hex[:8].upper()}"
            existing = self.requisition_repo.get_by_pr_number(candidate, company_id)
            if not existing:
                return candidate