from pydantic import BaseModel
from decimal import Decimal

class SupplierSpendReport(BaseModel):
    supplier_name: str
    total_spend: Decimal
    invoice_count: int

class DepartmentSpendReport(BaseModel):
    department_name: str
    total_spend: Decimal
    po_count: int

class LeadTimeReport(BaseModel):
    po_number: str
    supplier_name: str
    avg_lead_time_days: float