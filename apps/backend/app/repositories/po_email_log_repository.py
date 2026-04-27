from uuid import UUID

from sqlalchemy.orm import Session

from app.models.enums import EmailStatusEnum
from app.models.po_email_log import POEmailLog


class POEmailLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, email_log: POEmailLog) -> POEmailLog:
        self.db.add(email_log)
        self.db.flush()
        self.db.refresh(email_log)
        return email_log

    def get_by_id(
        self,
        email_log_id: UUID,
        company_id: UUID,
    ) -> POEmailLog | None:
        return (
            self.db.query(POEmailLog)
            .filter(
                POEmailLog.id == email_log_id,
                POEmailLog.company_id == company_id,
            )
            .first()
        )

    def get_all_by_po(
        self,
        purchase_order_id: UUID,
        company_id: UUID,
    ) -> list[POEmailLog]:
        return (
            self.db.query(POEmailLog)
            .filter(
                POEmailLog.purchase_order_id == purchase_order_id,
                POEmailLog.company_id == company_id,
            )
            .order_by(POEmailLog.created_at.desc())
            .all()
        )

    def get_all_by_status(
        self,
        status: EmailStatusEnum,
        company_id: UUID,
    ) -> list[POEmailLog]:
        return (
            self.db.query(POEmailLog)
            .filter(
                POEmailLog.status == status,
                POEmailLog.company_id == company_id,
            )
            .order_by(POEmailLog.created_at.desc())
            .all()
        )