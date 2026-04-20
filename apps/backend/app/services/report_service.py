from sqlalchemy.orm import Session
from app.repositories.report_repository import ReportRepository
from app.utils.excel_generator import generate_excel

class ReportService:
    def __init__(self):
        self.repo = ReportRepository()

# Supplier Excel
    def get_supplier_report(self, db):
        data = self.repo.supplier_spend(db)

        formatted = [
            (r.supplier_name, float(r.total_spend), r.invoice_count)
            for r in data
        ]

        headers = ["Supplier", "Total Spend", "Invoice Count"]
        return generate_excel(formatted, headers)   
     
# Department Excel
    def get_department_report(self, db: Session):
        data = self.repo.department_spend(db)

        formatted = [
            (r.department_name, float(r.total_spend), r.po_count)
            for r in data
        ]

        headers = ["Department", "Total Spend", "PO Count"]

        return generate_excel(formatted, headers)
    
# Lead Time Excel
    def get_lead_time_report(self, db: Session):
        data = self.repo.lead_time(db)

        formatted = [
            (r.po_number, r.supplier_name, float(r.avg_lead_time_days or 0))
            for r in data
        ]

        headers = ["PO Number", "Supplier", "Avg Lead Time (Days)"]

        return generate_excel(formatted, headers)