from datetime import datetime
from decimal import Decimal
from typing import List, Literal, Optional

from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_purchase_requisitions: int
    total_purchase_orders: int
    pending_approvals: int
    total_spend: Decimal


class DashboardActionCenter(BaseModel):
    pending_pr_approvals: int
    pending_po_approvals: int
    pending_invoice_approvals: int
    pending_payment_approvals: int
    approved_prs_awaiting_po: int
    approved_invoices_awaiting_payment: int


class ProcurementWorkflowSummary(BaseModel):
    purchase_requisitions: int
    purchase_orders: int
    invoices: int
    payments: int


class SpendSnapshot(BaseModel):
    month_to_date_spend: Decimal
    average_po_value: Decimal
    active_supplier_count: int
    top_category: Optional[str] = None


class SupplierScorecardItem(BaseModel):
    supplier_id: str
    supplier_name: str
    category: Optional[str] = None
    sub_category: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    total_orders: int
    received_orders: int
    invoice_count: int
    paid_invoice_count: int
    total_spend: Decimal
    performance_score: int
    performance_label: Literal["Excellent", "Good", "Watch", "New"]
    last_order_date: Optional[datetime] = None


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
    action_center: DashboardActionCenter
    workflow: ProcurementWorkflowSummary
    spend_snapshot: SpendSnapshot
    supplier_scorecards: List[SupplierScorecardItem]
    approval_queue: List[ApprovalQueueItem]
    recent_activity: List[RecentActivityItem]
    reporting_snapshot: ReportingSnapshot
