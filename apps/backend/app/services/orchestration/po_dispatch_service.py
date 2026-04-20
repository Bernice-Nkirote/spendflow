from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import POStatusEnum
from app.repositories.po_item_repository import PurchaseOrderItemRepository
from app.repositories.supplier_repository import SupplierRepository
from app.services.documents.pdf_service import PDFService
from app.services.notifications.email_service import EmailService
from app.services.po_service import PurchaseOrderService


class PODispatchService:
    def __init__(
        self,
        po_service: PurchaseOrderService,
        po_item_repo: PurchaseOrderItemRepository,
        supplier_repo: SupplierRepository,
        pdf_service: PDFService,
        email_service: EmailService,
    ):
        self.po_service = po_service
        self.po_item_repo = po_item_repo
        self.supplier_repo = supplier_repo
        self.pdf_service = pdf_service
        self.email_service = email_service

    def _validate_supplier_email(self, supplier) -> str:
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found",
            )

        if not supplier.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot send purchase order to an inactive supplier",
            )

        if not supplier.email or not supplier.email.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Supplier email is required before sending the purchase order",
            )

        return supplier.email.strip()

    def send_po_to_supplier(
        self,
        po_id: UUID,
        company_id: UUID,
        issued_by: UUID,
    ):
        po = self.po_service.get_po(po_id, company_id)

        if po.status != POStatusEnum.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved purchase orders can be sent to suppliers",
            )

        supplier = self.supplier_repo.get_by_id(po.supplier_id, company_id)
        supplier_email = self._validate_supplier_email(supplier)

        items = self.po_item_repo.get_all_by_po(po.id, company_id)
        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order must have at least one item before sending",
            )

        pdf_bytes = self.pdf_service.generate_po_pdf(
            po=po,
            supplier=supplier,
            items=items,
        )

        self.email_service.send_po_email(
            to_email=supplier_email,
            supplier_name=supplier.name,
            po_number=po.po_number,
            attachment_bytes=pdf_bytes,
            attachment_filename=f"{po.po_number}.pdf",
        )

        return self.po_service.issue_po(
            po_id=po.id,
            company_id=company_id,
            issued_by=issued_by,
        )