from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import POStatusEnum
from app.repositories.po_item_repository import PurchaseOrderItemRepository
from app.repositories.supplier_repository import SupplierRepository
from app.services.documents.pdf_service import PDFService
from app.services.po_service import PurchaseOrderService


class POPDFService:
    def __init__(
        self,
        po_service: PurchaseOrderService,
        po_item_repo: PurchaseOrderItemRepository,
        supplier_repo: SupplierRepository,
        pdf_service: PDFService,
    ):
        self.po_service = po_service
        self.po_item_repo = po_item_repo
        self.supplier_repo = supplier_repo
        self.pdf_service = pdf_service

    def generate_po_pdf(
        self,
        po_id: UUID,
        company_id: UUID,
    ) -> tuple[bytes, str]:
        po = self.po_service.get_po(po_id, company_id)

        if po.status not in {POStatusEnum.APPROVED, POStatusEnum.SENT}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF can only be generated for approved or sent purchase orders",
            )

        supplier = self.supplier_repo.get_by_id(po.supplier_id, company_id)
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Supplier not found",
            )

        items = self.po_item_repo.get_all_by_po(po.id, company_id)
        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order must have at least one item before generating PDF",
            )

        pdf_bytes = self.pdf_service.generate_po_pdf(
            po=po,
            supplier=supplier,
            items=items,
        )

        return pdf_bytes, f"{po.po_number}.pdf"