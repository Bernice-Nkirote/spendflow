import api from "../../../api/axiosInstance";
import type { DashboardData } from "../types/dashboard.types";

export async function getDashboardData(): Promise<DashboardData> {
  const response = await api.get("/dashboard");

  const data = response.data;

  return {
    currency: data.currency,

    summary: {
      totalPurchaseRequisitions: data.summary.total_purchase_requisitions,
      totalPurchaseOrders: data.summary.total_purchase_orders,
      pendingApprovals: data.summary.pending_approvals,
      totalSpend: Number(data.summary.total_spend),
    },

    workflow: {
      purchaseRequisitions: data.workflow.purchase_requisitions,
      purchaseOrders: data.workflow.purchase_orders,
      invoices: data.workflow.invoices,
      payments: data.workflow.payments,
    },

    approvalQueue: data.approval_queue.map((item: any) => ({
      id: item.id,
      documentType: item.document_type,
      documentReference: item.document_reference,
      status: item.status,
      requestedBy: item.requested_by,
      createdAt: item.created_at,
    })),

    recentActivity: data.recent_activity.map((activity: any) => ({
      id: activity.id,
      action: activity.action,
      entityType: activity.entity_type,
      entityReference: activity.entity_reference,
      performedBy: activity.performed_by,
      createdAt: activity.created_at,
    })),

    reportingSnapshot: {
      totalReportsGenerated: data.reporting_snapshot.total_reports_generated,
      lastReportGeneratedAt: data.reporting_snapshot.last_report_generated_at,
      exportFormatsAvailable: data.reporting_snapshot.export_formats_available,
    },
  };
}
