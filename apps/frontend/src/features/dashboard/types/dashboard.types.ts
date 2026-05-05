export type DashboardSummary = {
  totalPurchaseRequisitions: number;
  totalPurchaseOrders: number;
  pendingApprovals: number;
  totalSpend: number;
};

export type ProcurementWorkflowSummary = {
  purchaseRequisitions: number;
  purchaseOrders: number;
  invoices: number;
  payments: number;
};

export type ApprovalQueueItem = {
  id: string;
  documentType: "PR" | "PO" | "INVOICE" | "PAYMENT";
  documentReference: string;
  status: string;
  requestedBy?: string;
  createdAt: string;
};

export type RecentActivityItem = {
  id: string;
  action: string;
  entityType: string;
  entityReference?: string;
  performedBy?: string;
  createdAt: string;
};

export type ReportingSnapshot = {
  totalReportsGenerated: number;
  lastReportGeneratedAt?: string;
  exportFormatsAvailable: Array<"CSV" | "EXCEL">;
};

export type DashboardData = {
  currency: string;
  summary: DashboardSummary;
  workflow: ProcurementWorkflowSummary;
  approvalQueue: ApprovalQueueItem[];
  recentActivity: RecentActivityItem[];
  reportingSnapshot: ReportingSnapshot;
};
