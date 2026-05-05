from uuid import UUID

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.report_export_log import ReportExportLog


class ReportExportLogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        company_id: UUID,
        user_id: UUID,
        report_type: str,
        export_format: str,
    ) -> ReportExportLog:
        log = ReportExportLog(
            company_id=company_id,
            user_id=user_id,
            report_type=report_type,
            export_format=export_format,
        )

        self.db.add(log)
        self.db.flush()
        self.db.refresh(log)

        return log

    def count_by_company(self, company_id: UUID) -> int:
        return (
            self.db.query(func.count(ReportExportLog.id))
            .filter(ReportExportLog.company_id == company_id)
            .scalar()
            or 0
        )

    def get_last_generated_at(self, company_id: UUID):
        return (
            self.db.query(func.max(ReportExportLog.created_at))
            .filter(ReportExportLog.company_id == company_id)
            .scalar()
        )