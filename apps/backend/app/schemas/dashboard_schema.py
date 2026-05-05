from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_purchase_requisitions: int
    total_purchase_orders: int
    pending_approvals: int
    total_spend: Decimal


class ProcurementWorkflowSummary(BaseModel):
    purchase_requisitions: int
    purchase_orders: int
    invoices: int
    payments: int


class ApprovalQueueItem(BaseModel):
    id: str
    document_type: Literal["PR", "PO", "INVOICE", "PAYMENT"]
    document_reference: str
    status: str
    requested_by: Optional[str] = None
    created_at: datetime


class RecentActivityItem(BaseModel):
    id: str
    action: str
    entity_type: str
    entity_reference: Optional[str] = None
    performed_by: Optional[str] = None
    created_at: datetime


class ReportingSnapshot(BaseModel):
    total_reports_generated: int
    last_report_generated_at: Optional[datetime] = None
    export_formats_available: List[Literal["CSV", "EXCEL"]]


class DashboardResponse(BaseModel):
    currency: str
    summary: DashboardSummary
    workflow: ProcurementWorkflowSummary
    approval_queue: List[ApprovalQueueItem]
    recent_activity: List[RecentActivityItem]
    reporting_snapshot: ReportingSnapshot