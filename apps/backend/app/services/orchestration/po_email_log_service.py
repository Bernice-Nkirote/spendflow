# handles email log retrieval
from uuid import UUID

from app.repositories.po_email_log_repository import POEmailLogRepository
from app.services.po_service import PurchaseOrderService


class POEmailLogService:
    def __init__(
        self,
        po_service: PurchaseOrderService,
        po_email_log_repo: POEmailLogRepository,
    ):
        self.po_service = po_service
        self.po_email_log_repo = po_email_log_repo

    def get_all_logs_for_po(
        self,
        po_id: UUID,
        company_id: UUID,
    ):
        self.po_service.get_po(po_id, company_id)

        return self.po_email_log_repo.get_all_by_po(
            purchase_order_id=po_id,
            company_id=company_id,
        )
