from datetime import datetime, timezone
from decimal import Decimal
from pathlib import Path
from shutil import copyfileobj
from uuid import UUID, uuid4

from fastapi import HTTPException,UploadFile, status

from app.utils.value_helper.enum_utils import enum_value
from app.models.approval_instance import ApprovalInstance
from app.models.enums import ApprovalStatus, EntityTypeEnum, POStatusEnum, PRStatusEnum
from app.models.purchase_order import PurchaseOrder
from app.models.purchase_order_item import PurchaseOrderItem
from app.repositories.approval_workflow_repository import ApprovalWorkflowRepository
from app.repositories.po_item_repository import PurchaseOrderItemRepository
from app.repositories.po_repository import PurchaseOrderRepository
from app.repositories.pr_item_repository import PurchaseRequisitionItemRepository
from app.repositories.pr_repository import PurchaseRequisitionRepository
from app.schemas.po_schema import PurchaseOrderPaginatedRead
from app.services.approval_instance_service import ApprovalInstanceService
from app.services.permission_service import PermissionService
from app.services.audit_log_service import AuditLogService
from app.services.exchange_rate_service import ExchangeRateService

class PurchaseOrderService:
    def __init__(
        self,
        po_repo: PurchaseOrderRepository,
        po_item_repo: PurchaseOrderItemRepository,
        pr_repo: PurchaseRequisitionRepository,
        pr_item_repo: PurchaseRequisitionItemRepository,
        workflow_repo: ApprovalWorkflowRepository,
        approval_instance_service: ApprovalInstanceService,
        permission_service : PermissionService,
        audit_log_service: AuditLogService,
        exchange_rate_service: ExchangeRateService,
        
    ):
        self.po_repo = po_repo
        self.po_item_repo = po_item_repo
        self.pr_repo = pr_repo
        self.pr_item_repo = pr_item_repo
        self.workflow_repo = workflow_repo
        self.approval_instance_service = approval_instance_service
        self.permission_service = permission_service
        self.audit_log_service = audit_log_service
        self.exchange_rate_service = exchange_rate_service
    
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

    def _calculate_po_total(self, items: list[PurchaseOrderItem]) -> Decimal:
        total = Decimal("0.00")

        for item in items:
            total += item.total_price

        return total

    def _validate_po_financial_values(
        self,
        po: PurchaseOrder,
        company_id: UUID,
    ) -> None:
        items = self.po_item_repo.get_all_by_po(po.id, company_id)

        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order must have at least one item",
            )

        total_amount = self._calculate_po_total(items)

        if total_amount <= Decimal("0"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order total amount must be greater than zero before submission or approval",
            )

        for item in items:
            if item.quantity <= Decimal("0"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Each purchase order item quantity must be greater than zero",
                )

            if item.unit_price <= Decimal("0"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Each purchase order item unit price must be greater than zero",
                )

            if item.total_price <= Decimal("0"):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Each purchase order item total must be greater than zero",
                )

    def _recalculate_po_total(
        self,
        po: PurchaseOrder,
        company_id: UUID,
    ) -> PurchaseOrder:
        items = self.po_item_repo.get_all_by_po(po.id, company_id)
        po.total_amount = self._calculate_po_total(items)

        updated_po = self.po_repo.update(po)
        updated_po.items = items

        return updated_po
    
    def _enrich_po_readable_fields(self, po: PurchaseOrder) -> PurchaseOrder:
        po.supplier_name = po.supplier.name if po.supplier else None
        po.supplier_email = po.supplier.email if po.supplier else None
        po.department_name = po.department.name if po.department else None
        po.created_by_name = po.creator.name if po.creator else None
        po.submitted_by_name = po.submitter.name if po.submitter else None
        po.issued_by_name = po.issuer.name if po.issuer else None
        po.signed_pdf_uploaded_by_name = (
            po.signed_pdf_uploader.name if po.signed_pdf_uploader else None
        )
        po.pr_number = (
            po.purchase_requisition.pr_number
            if po.purchase_requisition
            else None
        )

        return po


    def upload_signed_po_pdf(
        self,
        po_id: UUID,
        company_id: UUID,
        uploaded_by: UUID,
        role_id: UUID,
        file: UploadFile,
    ) -> PurchaseOrder:
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="po.dispatch",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to upload signed purchase order PDFs",
            )

        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signed PDF can only be uploaded for approved purchase orders",
            )

        if not file.filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must have a filename",
            )

        original_filename = file.filename.strip()

        if not original_filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only PDF files can be uploaded",
            )

        if file.content_type not in {"application/pdf", "application/octet-stream"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must be a PDF",
            )

        upload_dir = Path("uploads") / "purchase_orders" / str(company_id) / str(po.id)
        upload_dir.mkdir(parents=True, exist_ok=True)

        stored_filename = f"signed-{po.po_number}-{uuid4().hex}.pdf"
        file_path = upload_dir / stored_filename

        with file_path.open("wb") as buffer:
            copyfileobj(file.file, buffer)

        po.signed_pdf_file_path = str(file_path)
        po.signed_pdf_original_filename = original_filename
        po.signed_pdf_uploaded_by = uploaded_by
        po.signed_pdf_uploaded_at = datetime.now(timezone.utc)

        updated_po = self.po_repo.update(po)

        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PO",
            entity_id=po.id,
            action="PO_SIGNED_PDF_UPLOADED",
            actor_user_id=uploaded_by,
            description=f"Signed PDF uploaded for purchase order {po.po_number}",
            new_values_json={
                "po_number": po.po_number,
                "signed_pdf_original_filename": original_filename,
                "signed_pdf_file_path": str(file_path),
                "signed_pdf_uploaded_by": str(uploaded_by),
                "signed_pdf_uploaded_at": po.signed_pdf_uploaded_at.isoformat()
                if po.signed_pdf_uploaded_at
                else None,
            },
        )

        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        updated_po = self.get_po(po_id=po.id, company_id=company_id)

        return updated_po

# Create many PO items in one operation, internal
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

    def _normalize_pr_item_key(self, item_name: str) -> str:
        return item_name.strip().casefold()

    def _validate_po_items_against_requisition(
        self,
        requisition_id: UUID,
        company_id: UUID,
        items_data,
    ) -> None:
        requisition_items = self.pr_item_repo.get_by_requisition_id(
            requisition_id,
            company_id,
        )
        if not requisition_items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Linked purchase requisition has no items to validate against",
            )

        approved_quantities: dict[str, Decimal] = {}
        approved_names: dict[str, str] = {}

        for pr_item in requisition_items:
            item_name, _, quantity, _ = self._extract_pr_item_values(pr_item)
            key = self._normalize_pr_item_key(item_name)
            approved_quantities[key] = approved_quantities.get(key, Decimal("0")) + quantity
            approved_names[key] = item_name

        requested_quantities: dict[str, Decimal] = {}

        for item_data in items_data:
            self._validate_item_fields(item_data)

            item_name = str(item_data.item_name).strip()
            key = self._normalize_pr_item_key(item_name)

            if key not in approved_quantities:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "POs linked to a purchase requisition can only include "
                        "items from the approved requisition"
                    ),
                )

            requested_quantities[key] = (
                requested_quantities.get(key, Decimal("0"))
                + Decimal(item_data.quantity)
            )

        for key, requested_quantity in requested_quantities.items():
            if requested_quantity > approved_quantities[key]:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"PO quantity for {approved_names[key]} cannot exceed "
                        "the approved purchase requisition quantity"
                    ),
                )
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

        po.items = self.po_item_repo.get_all_by_po(po.id, company_id)

        return self._enrich_po_readable_fields(po)

    def create_po(
        self,
        po_data,
        company_id: UUID,
        created_by: UUID,
        role_id: UUID,
    ) -> PurchaseOrder:
        # Permission Check
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="po.create",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to create purchase orders",
            )
        
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

        updated_po = self._recalculate_po_total(created_po, company_id)
        # AUDIT LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PO",
            entity_id=updated_po.id,
            action="PO_CREATED",
            actor_user_id=created_by,
            description=f"Purchase order {updated_po.po_number} created",
            new_values_json={
                "po_number": updated_po.po_number,
                "supplier_id":str(updated_po.supplier_id),
                "total_amount": str(updated_po.total_amount),
                "currency":updated_po.currency,
                "status": updated_po.status,
            },
        )

        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return self.get_po(
            po_id=updated_po.id,
            company_id=company_id,
        )

    def create_po_from_pr(
        self,
        requisition_id: UUID,
        po_data,
        company_id: UUID,
        created_by: UUID,
        role_id: UUID,
    ) -> PurchaseOrder:
        # Permission check 
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="po.create",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to create purchase orders",
            )
        
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

        if po_data.items:
            self._validate_po_items_against_requisition(
                requisition_id=requisition.id,
                company_id=company_id,
                items_data=po_data.items,
            )

        items_source = po_data.items if po_data.items else requisition_items

        for item_data in items_source:
            if po_data.items:
                self._validate_item_fields(item_data)

                item_name = item_data.item_name.strip()
                description = item_data.description
                quantity = Decimal(item_data.quantity)
                unit_price = Decimal(item_data.unit_price)
            else:
                item_name, description, quantity, unit_price = self._extract_pr_item_values(
                    item_data
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

        requisition.status = PRStatusEnum.CONVERTED_TO_PO
        self.pr_repo.update(requisition)

        updated_po = self._recalculate_po_total(created_po, company_id)

        # AUDIT CHECK FOR CONVERTING PR TO PO
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PR",
            entity_id=requisition.id,
            action="PR_CONVERTED_TO_PO",
            actor_user_id=created_by,
            description=f"Purchase requisition {requisition.pr_number} converted to PO {created_po.po_number}",
            old_values_json={
                "status": PRStatusEnum.APPROVED.value,
            },
            new_values_json={
                "status": PRStatusEnum.CONVERTED_TO_PO.value,
                "po_id": str(created_po.id),
                "po_number": created_po.po_number,
            },
        )
        # AUDIT CHECK FOR CREATING PO
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PO",
            entity_id=updated_po.id,
            action="PO_CREATED",
            actor_user_id=created_by,
            description=f"Purchase order {updated_po.po_number} created from PR {requisition.pr_number}",
            new_values_json={
                "po_number": updated_po.po_number,
                "purchase_requisition_id": str(requisition.id),
                "supplier_id": str(updated_po.supplier_id),
                "total_amount": str(updated_po.total_amount),
                "currency": updated_po.currency,
                "status": updated_po.status,
            },
        )
        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return self.get_po(
            po_id=updated_po.id,
            company_id=company_id,
        )

    def get_all_pos(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseOrder]:
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

        purchase_orders = self.po_repo.get_all(company_id, skip, limit)

        return [
            self._enrich_po_readable_fields(po)
            for po in purchase_orders
        ]

    def get_all_pos_paginated(
        self,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> PurchaseOrderPaginatedRead:
        rows = self.get_all_pos(
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        total_count = self.po_repo.count_all(company_id)

        return PurchaseOrderPaginatedRead(
            rows=rows,
            total_count=total_count,
        )

    def get_ready_for_invoicing_pos(
        self,
        company_id: UUID,
        role_id: UUID,
    ) -> list[PurchaseOrder]:
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="invoice.create",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to create invoices",
            )

        purchase_orders = self.po_repo.get_ready_for_invoicing(
            company_id=company_id,
        )

        return [
            self._enrich_po_readable_fields(po)
            for po in purchase_orders
        ]

    def get_all_pos_by_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseOrder]:
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

        return self.po_repo.get_by_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def get_all_pos_by_supplier_paginated(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> PurchaseOrderPaginatedRead:
        rows = self.get_all_pos_by_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        total_count = self.po_repo.count_by_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
        )

        return PurchaseOrderPaginatedRead(
            rows=rows,
            total_count=total_count,
        )

    def get_visible_pos_by_supplier(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseOrder]:
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

        purchase_orders = self.po_repo.get_visible_to_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        return [
            self._enrich_po_readable_fields(po)
            for po in purchase_orders
        ]


    def get_visible_pos_by_supplier_paginated(
        self,
        supplier_id: UUID,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> PurchaseOrderPaginatedRead:
        rows = self.get_visible_pos_by_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

        total_count = self.po_repo.count_visible_to_supplier(
            supplier_id=supplier_id,
            company_id=company_id,
        )

        return PurchaseOrderPaginatedRead(
            rows=rows,
            total_count=total_count,
        )

    def get_all_pos_by_status(
        self,
        po_status: POStatusEnum,
        company_id: UUID,
        skip: int = 0,
        limit: int = 20,
    ) -> list[PurchaseOrder]:
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

        return self.po_repo.get_by_status(
            status=po_status,
            company_id=company_id,
            skip=skip,
            limit=limit,
        )

    def update_po(
        self,
        po_id: UUID,
        po_data,
        company_id: UUID,
        user_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        old_values = {
            "supplier_id": str(po.supplier_id) if po.supplier_id else None,
            "department_id": str(po.department_id) if po.department_id else None,
            "currency": po.currency,
            "notes": po.notes,
            "total_amount": str(po.total_amount),
        }

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

            if po.purchase_requisition_id:
                self._validate_po_items_against_requisition(
                    requisition_id=po.purchase_requisition_id,
                    company_id=company_id,
                    items_data=po_data.items,
                )

            self._replace_po_items(updated_po.id, company_id, po_data.items)
            updated_po = self._recalculate_po_total(updated_po, company_id)
        
        # AUDITC CHECK LOGS
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PO",
            entity_id=updated_po.id,
            action="PO_UPDATED",
            actor_user_id=user_id,
            description=f"Purchase order {updated_po.po_number} updated",
            old_values_json=old_values,
            new_values_json={
                "supplier_id": str(updated_po.supplier_id) if updated_po.supplier_id else None,
                "department_id": str(updated_po.department_id) if updated_po.department_id else None,
                "currency": updated_po.currency,
                "notes": updated_po.notes,
                "total_amount": str(updated_po.total_amount),
                "items_updated": po_data.items is not None,
            },
        )

        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return self.get_po(
            po_id=updated_po.id,
            company_id=company_id,
        )

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
        self._recalculate_po_total(po, company_id)

        self.po_item_repo.db.commit()
        self.po_item_repo.db.refresh(created_item)

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

        item_name = (
            item_data.item_name
            if item_data.item_name is not None
            else item.item_name
        )
        description = (
            item_data.description
            if item_data.description is not None
            else item.description
        )
        quantity = (
            Decimal(item_data.quantity)
            if item_data.quantity is not None
            else item.quantity
        )
        unit_price = (
            Decimal(item_data.unit_price)
            if item_data.unit_price is not None
            else item.unit_price
        )

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
        self._recalculate_po_total(po, company_id)

        self.po_item_repo.db.commit()
        self.po_item_repo.db.refresh(updated_item)

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
        self._recalculate_po_total(po, company_id)

        self.po_item_repo.db.commit()

        return item

    def submit_po(
        self,
        po_id: UUID,
        company_id: UUID,
        submitted_by: UUID,
        role_id: UUID,
    ) -> PurchaseOrder:
        # Permission check
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="po.submit",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to submit purchase orders",
            )
        
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

        po = self._recalculate_po_total(po, company_id)
        self._validate_po_financial_values(po, company_id)

        workflow = self.workflow_repo.get_active_by_entity_type(
            entity_type=EntityTypeEnum.PO,
            company_id=company_id,
        )
        if not workflow:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active approval workflow configured for purchase orders",
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
            entity_id=po.id,
            entity_type=EntityTypeEnum.PO,
            company_id=company_id,
        )
        if existing_pending:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A pending approval instance already exists for this purchase order",
            )

        base_amount, exchange_rate, base_currency, exchange_rate_date = (
            self.exchange_rate_service.convert_transaction_to_company_base_currency(
                company_id=company_id,
                amount=po.total_amount,
                transaction_currency=po.currency,
                as_of_date=po.created_at.date(),
            )
        )

        po.exchange_rate = exchange_rate
        po.base_currency = base_currency
        po.base_amount = base_amount
        po.exchange_rate_date = exchange_rate_date

        approval_instance = ApprovalInstance(
            company_id=company_id,
            workflow_id=workflow.id,
            entity_id=po.id,
            entity_type=EntityTypeEnum.PO,
            current_level_id=first_level.id,
            status=ApprovalStatus.PENDING,
        )

        self.approval_instance_service.repo.create(approval_instance)

        po.submitted_by = submitted_by
        po.submitted_at = datetime.now(timezone.utc)
        po.status = POStatusEnum.PENDING_APPROVAL

        updated_po = self.po_repo.update(po)

        # AUDIT CHECK FOR SUBMIT PO
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PO",
            entity_id=po.id,
            action="PO_SUBMITTED",
            actor_user_id=submitted_by,
            description=f"Purchase order {po.po_number} submitted for approval",
            old_values_json={
                "status": POStatusEnum.DRAFT.value,
            },
            new_values_json={
                "status": POStatusEnum.PENDING_APPROVAL.value,
            },
        )
        
        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return self.get_po(
            po_id=updated_po.id,
            company_id=company_id,
        )

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

        po = self._recalculate_po_total(po, company_id)
        self._validate_po_financial_values(po, company_id)

        po.status = POStatusEnum.APPROVED

        updated_po = self.po_repo.update(po)
        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return updated_po

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

        updated_po = self.po_repo.update(po)
        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return updated_po

    def issue_po(
        self,
        po_id: UUID,
        company_id: UUID,
        issued_by: UUID,
        role_id: UUID,
    ) -> PurchaseOrder:
        # Permission check
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="po.dispatch",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to dispatch purchase orders",
            )
        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved purchase orders can be issued",
            )

        po.issued_by = issued_by
        po.issued_at = datetime.now(timezone.utc)
        po.status = POStatusEnum.SENT

        updated_po = self.po_repo.update(po)
        
        # AUDIT CHECK LOG
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PO",
            entity_id=po.id,
            action="PO_ISSUED",
            actor_user_id=issued_by,
            description=f"Purchase order {po.po_number} issued",
            old_values_json={
                "status": POStatusEnum.APPROVED.value,
            },
            new_values_json={
                "status": POStatusEnum.SENT.value,
                "issued_by": str(issued_by),
                "issued_at": po.issued_at.isoformat() if po.issued_at else None,
            },
        )

        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return self.get_po(
            po_id=updated_po.id,
            company_id=company_id,
        )

    def record_external_distribution(
        self,
        po_id: UUID,
        company_id: UUID,
        issued_by: UUID,
        role_id: UUID,
    ) -> PurchaseOrder:
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="po.dispatch",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to record PO distribution",
            )

        po = self.get_po(po_id, company_id)

        if po.status != POStatusEnum.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved purchase orders can be marked as shared with supplier",
            )

        old_status = po.status

        po.issued_by = issued_by
        po.issued_at = datetime.now(timezone.utc)
        po.status = POStatusEnum.SENT

        updated_po = self.po_repo.update(po)

        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PO",
            entity_id=po.id,
            action="PO_EXTERNAL_DISTRIBUTION_RECORDED",
            actor_user_id=issued_by,
            description=f"Purchase order {po.po_number} marked as shared with supplier outside Tendaflow",
            old_values_json={
                "status": enum_value(old_status),
                "issued_at": None,
            },
            new_values_json={
                "status": enum_value(po.status),
                "issued_by": str(issued_by),
                "issued_at": po.issued_at.isoformat() if po.issued_at else None,
                "distribution_method": "EXTERNAL",
            },
        )

        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return self.get_po(
            po_id=updated_po.id,
            company_id=company_id,
        )

    def mark_po_partially_received(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> PurchaseOrder:
        po = self.get_po(po_id, company_id)

        if po.status not in {POStatusEnum.SENT, POStatusEnum.PARTIALLY_RECEIVED}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only sent or partially received purchase orders can be marked as partially received",
            )

        po.status = POStatusEnum.PARTIALLY_RECEIVED

        updated_po = self.po_repo.update(po)
        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return updated_po

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

        updated_po = self.po_repo.update(po)
        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return updated_po

    def cancel_po(
        self,
        po_id: UUID,
        company_id: UUID,
        role_id: UUID,
        user_id: UUID,
    ) -> PurchaseOrder:
        # permission check
        if not self.permission_service.role_has_permission(
            role_id=role_id,
            permission_name="po.cancel",
            company_id=company_id,
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel purchase orders",
            )
        
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

        old_status = po.status
        po.status = POStatusEnum.CANCELLED

        updated_po = self.po_repo.update(po)

        # AUDIT LOG CHECK
        self.audit_log_service.log_action(
            company_id=company_id,
            entity_type="PO",
            entity_id=po.id,
            action="PO_CANCELLED",
            actor_user_id=user_id,
            description=f"Purchase order {po.po_number} cancelled",
            old_values_json={
                "status": enum_value(old_status),
            },
            new_values_json={
                "status": enum_value(POStatusEnum.CANCELLED),
            },
        )
        
        self.po_repo.db.commit()
        self.po_repo.db.refresh(updated_po)

        return self.get_po(
            po_id=updated_po.id,
            company_id=company_id,
        )

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
        self.po_repo.db.commit()

        return po
