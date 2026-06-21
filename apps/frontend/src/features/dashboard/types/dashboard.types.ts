export type DashboardSummary = {
  totalPurchaseRequisitions: number;
  totalPurchaseOrders: number;
  pendingApprovals: number;
  totalSpend: number;
};

export type DashboardActionCenter = {
  pendingPrApprovals: number;
  pendingPoApprovals: number;
  pendingInvoiceApprovals: number;
  pendingPaymentApprovals: number;
  approvedPrsAwaitingPo: number;
  approvedInvoicesAwaitingPayment: number;
};

export type ProcurementWorkflowSummary = {
  purchaseRequisitions: number;
  purchaseOrders: number;
  invoices: number;
  payments: number;
};

export type SpendSnapshot = {
  monthToDateSpend: number;
  averagePoValue: number;
  activeSupplierCount: number;
  topCategory?: string;
};

export type SupplierScorecardItem = {
  supplierId: string;
  supplierName: string;
  category?: string;
  subCategory?: string;
  contactPerson?: string;
  email?: string;
  totalOrders: number;
  receivedOrders: number;
  invoiceCount: number;
  paidInvoiceCount: number;
  totalSpend: number;
  performanceScore: number;
  performanceLabel: "Excellent" | "Good" | "Watch" | "New";
  lastOrderDate?: string;
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
  actionCenter: DashboardActionCenter;
  workflow: ProcurementWorkflowSummary;
  spendSnapshot: SpendSnapshot;
  supplierScorecards: SupplierScorecardItem[];
  approvalQueue: ApprovalQueueItem[];
  recentActivity: RecentActivityItem[];
  reportingSnapshot: ReportingSnapshot;
};
