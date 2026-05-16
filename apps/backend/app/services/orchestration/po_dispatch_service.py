# This module handles send and resend of emails
from datetime import datetime, timezone
from pathlib import Path
from uuid import UUID

from fastapi import HTTPException, status

from app.models.enums import EmailStatusEnum, POStatusEnum
from app.models.po_email_log import POEmailLog
from app.repositories.po_email_log_repository import POEmailLogRepository
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
        po_email_log_repo: POEmailLogRepository,
    ):
        self.po_service = po_service
        self.po_item_repo = po_item_repo
        self.supplier_repo = supplier_repo
        self.pdf_service = pdf_service
        self.email_service = email_service
        self.po_email_log_repo = po_email_log_repo

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

    def _get_po_items(
        self,
        po_id: UUID,
        company_id: UUID,
    ):
        items = self.po_item_repo.get_all_by_po(po_id, company_id)
        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Purchase order must have at least one item before sending",
            )
        return items


    def _get_signed_pdf_attachment(
        self,
        po,
    ) -> tuple[bytes, str]:
        if not po.signed_pdf_file_path:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Upload a signed PO PDF before dispatching to supplier.",
            )

        file_path = Path(po.signed_pdf_file_path)

        if not file_path.exists() or not file_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signed PO PDF file was not found. Please upload it again before dispatch.",
            )

        return (
            file_path.read_bytes(),
            po.signed_pdf_original_filename or f"{po.po_number}-signed.pdf",
        )

    def _create_email_log(
        self,
        company_id: UUID,
        purchase_order_id: UUID,
        supplier_id: UUID,
        recipient_email: str,
        subject: str,
        status_value: EmailStatusEnum,
        sent_by: UUID,
        sent_at: datetime | None = None,
        error_message: str | None = None,
    ) -> POEmailLog:
        email_log = POEmailLog(
            company_id=company_id,
            purchase_order_id=purchase_order_id,
            supplier_id=supplier_id,
            recipient_email=recipient_email,
            subject=subject,
            status=status_value,
            error_message=error_message,
            sent_by=sent_by,
            sent_at=sent_at,
        )
        return self.po_email_log_repo.create(email_log)

    def send_po_to_supplier(
        self,
        po_id: UUID,
        company_id: UUID,
        issued_by: UUID,
        role_id: UUID,
    ):
        po = self.po_service.get_po(po_id, company_id)

        if po.status != POStatusEnum.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only approved purchase orders can be sent to suppliers",
            )

        supplier = self.supplier_repo.get_by_id(po.supplier_id, company_id)
        supplier_email = self._validate_supplier_email(supplier)
        
        self._get_po_items(po.id, company_id)

        pdf_bytes, attachment_filename = self._get_signed_pdf_attachment(po)

        subject = f"Purchase Order {po.po_number}"

        try:
            self.email_service.send_po_email(
                to_email=supplier_email,
                supplier_name=supplier.name,
                po_number=po.po_number,
                attachment_bytes=pdf_bytes,
                attachment_filename=attachment_filename,
            )

            sent_at = datetime.now(timezone.utc)

            self._create_email_log(
                company_id=company_id,
                purchase_order_id=po.id,
                supplier_id=supplier.id,
                recipient_email=supplier_email,
                subject=subject,
                status_value=EmailStatusEnum.SENT,
                sent_by=issued_by,
                sent_at=sent_at,
            )

            return self.po_service.issue_po(
                po_id=po.id,
                company_id=company_id,
                issued_by=issued_by,
                role_id=role_id,
            )

        except HTTPException as exc:
            self._create_email_log(
                company_id=company_id,
                purchase_order_id=po.id,
                supplier_id=supplier.id,
                recipient_email=supplier_email,
                subject=subject,
                status_value=EmailStatusEnum.FAILED,
                sent_by=issued_by,
                error_message=str(exc.detail) if hasattr(exc, "detail") else str(exc),
            )
            raise

        except Exception as exc:
            self._create_email_log(
                company_id=company_id,
                purchase_order_id=po.id,
                supplier_id=supplier.id,
                recipient_email=supplier_email,
                subject=subject,
                status_value=EmailStatusEnum.FAILED,
                sent_by=issued_by,
                error_message=str(exc),
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send purchase order email: {str(exc)}",
            ) from exc

    def resend_po_to_supplier(
        self,
        po_id: UUID,
        company_id: UUID,
        resent_by: UUID,
    ):
        po = self.po_service.get_po(po_id, company_id)

        if po.status != POStatusEnum.SENT:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only sent purchase orders can be resent",
            )

        supplier = self.supplier_repo.get_by_id(po.supplier_id, company_id)
        supplier_email = self._validate_supplier_email(supplier)
        
        self._get_po_items(po.id, company_id)

        pdf_bytes, attachment_filename = self._get_signed_pdf_attachment(po)

        subject = f"Purchase Order {po.po_number} - Resend"

        try:
            self.email_service.send_email(
                to_email=supplier_email,
                subject=subject,
                body=(
                    f"Dear {supplier.name},\n\n"
                    f"Please find attached signed Purchase Order {po.po_number}.\n\n"
                    "This is a resend copy.\n\n"
                    "Best regards,\n"
                    "Procurement Team"
                ),
                attachment_bytes=pdf_bytes,
                attachment_filename=attachment_filename,
            )

            self._create_email_log(
                company_id=company_id,
                purchase_order_id=po.id,
                supplier_id=supplier.id,
                recipient_email=supplier_email,
                subject=subject,
                status_value=EmailStatusEnum.SENT,
                sent_by=resent_by,
                sent_at=datetime.now(timezone.utc),
            )

            return po

        except HTTPException as exc:
            self._create_email_log(
                company_id=company_id,
                purchase_order_id=po.id,
                supplier_id=supplier.id,
                recipient_email=supplier_email,
                subject=subject,
                status_value=EmailStatusEnum.FAILED,
                sent_by=resent_by,
                error_message=str(exc.detail),
            )
            raise

        except Exception as exc:
            self._create_email_log(
                company_id=company_id,
                purchase_order_id=po.id,
                supplier_id=supplier.id,
                recipient_email=supplier_email,
                subject=subject,
                status_value=EmailStatusEnum.FAILED,
                sent_by=resent_by,
                error_message=str(exc),
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to resend purchase order email: {str(exc)}",
            ) from exc