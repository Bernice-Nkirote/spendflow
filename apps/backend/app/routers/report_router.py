from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.report_service import ReportService
from app.schemas.reports_schema import (
    SupplierSpendReport,
    DepartmentSpendReport,
    LeadTimeReport
)

router = APIRouter(prefix="/reports", tags=["Reports"])

report_service = ReportService()

# SUPPLIER EXCEL
@router.get("/suppliers/excel")
def supplier_excel(db: Session = Depends(get_db)):
    file = report_service.supplier_excel(db)

    return StreamingResponse(
        file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=supplier_report.xlsx"}
    )

# DEPARTMENT EXCEL
@router.get("/departments/excel")
def department_excel(db: Session = Depends(get_db)):
    file = report_service.department_excel(db)

    return StreamingResponse(
        file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=department_report.xlsx"}
    )

# LEAD TIME EXCEL
@router.get("/lead-time/excel")
def lead_time_excel(db: Session = Depends(get_db)):
    file = report_service.lead_time_excel(db)

    return StreamingResponse(
        file,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=lead_time_report.xlsx"}
    )