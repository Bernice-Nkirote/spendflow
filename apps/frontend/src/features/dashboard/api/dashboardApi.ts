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

    actionCenter: {
      pendingPrApprovals: data.action_center.pending_pr_approvals,
      pendingPoApprovals: data.action_center.pending_po_approvals,
      pendingInvoiceApprovals: data.action_center.pending_invoice_approvals,
      pendingPaymentApprovals: data.action_center.pending_payment_approvals,
      approvedPrsAwaitingPo: data.action_center.approved_prs_awaiting_po,
      approvedInvoicesAwaitingPayment:
        data.action_center.approved_invoices_awaiting_payment,
    },

    workflow: {
      purchaseRequisitions: data.workflow.purchase_requisitions,
      purchaseOrders: data.workflow.purchase_orders,
      invoices: data.workflow.invoices,
      payments: data.workflow.payments,
    },

    spendSnapshot: {
      monthToDateSpend: Number(data.spend_snapshot.month_to_date_spend),
      averagePoValue: Number(data.spend_snapshot.average_po_value),
      activeSupplierCount: data.spend_snapshot.active_supplier_count,
      topCategory: data.spend_snapshot.top_category,
    },

    supplierScorecards: data.supplier_scorecards.map((supplier: any) => ({
      supplierId: supplier.supplier_id,
      supplierName: supplier.supplier_name,
      category: supplier.category,
      subCategory: supplier.sub_category,
      contactPerson: supplier.contact_person,
      email: supplier.email,
      totalOrders: supplier.total_orders,
      receivedOrders: supplier.received_orders,
      invoiceCount: supplier.invoice_count,
      paidInvoiceCount: supplier.paid_invoice_count,
      totalSpend: Number(supplier.total_spend),
      performanceScore: supplier.performance_score,
      performanceLabel: supplier.performance_label,
      lastOrderDate: supplier.last_order_date,
    })),

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
