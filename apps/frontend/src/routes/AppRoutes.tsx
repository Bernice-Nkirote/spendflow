import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/auth/pages/LoginPage";
import CompanySignupPage from "../features/auth/pages/CompanySignupPage";
import SetupPasswordPage from "../features/auth/pages/SetupPasswordPage";
import ForgotPasswordPage from "../features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "../features/auth/pages/ResetPasswordPage";

import ReportsPage from "../features/reports/pages/ReportsPage";
import PurchaseRequisitionDetailsPage from "../features/purchase_requisition/pages/PurchaseRequisitionDetailsPage";
import PurchaseOrderDetailsPage from "../features/purchase_orders/pages/PurchaseOrderDetailsPage";
import InvoiceDetailsPage from "../features/invoices/pages/invoiceDetailsPage";
import InvoicesPage from "../features/invoices/pages/InvoicesPage";
import CreateInvoicePage from "../features/invoices/pages/CreateInvoicePage";
import PaymentDetailsPage from "../features/payments/pages/PaymentDetailsPage";
import PaymentsPage from "../features/payments/pages/PaymentsPage";
import CreatePaymentPage from "../features/payments/pages/CreatePaymentPage";
import OutstandingInvoiceDetailsPage from "../features/outstanding_invoice/pages/OutstandingInvoiceDetailsPage";
import SupplierSpendDetailsPage from "../features/supplier_spend/pages/SupplierSpendDetailsPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";
import SupplierLeadTimeDetailsPage from "../features/supplier_lead_time/pages/SupplierLeadTimeDetailsPage";
import PurchaseRequisitionsPage from "../features/purchase_requisition/pages/PurchaseRequisitionsPage";
import PurchaseOrdersPage from "../features/purchase_orders/pages/PurchaseOrdersPage";
import CreatePurchaseOrderPage from "../features/purchase_orders/pages/CreatePurchaseOrderPage";
import EditPurchaseOrderPage from "../features/purchase_orders/pages/EditPurchaseOrderPage";
import CreatePurchaseOrderFromPRPage from "../features/purchase_orders/pages/CreatePurchaseOrderFromPRPage";
import CreatePurchaseRequisitionPage from "../features/purchase_requisition/pages/CreatePurchaseRequisitionPage";
import EditPurchaseRequisitionPage from "../features/purchase_requisition/pages/EditPurchaseRequisitionPage";
import ApprovalQueuePage from "../features/approvals/pages/ApprovalQueuePage";
import ApprovalDetailPage from "../features/approvals/pages/ApprovalDetailPage";
import ApprovalWorkflowsPage from "../features/approval_workflows/pages/ApprovalWorkflowsPage";
import ExchangeRatesPage from "../features/exchange_rates/pages/ExchangeRatesPage";

import SuppliersPage from "../features/suppliers/pages/SuppliersPage";
import SupplierDetailsPage from "../features/suppliers/pages/SupplierDetailsPage";
import DepartmentsPage from "../features/Departments/pages/DepartmentsPage";
import RolesPage from "../features/roles/pages/RolesPage";
import UsersPage from "../features/users/pages/UsersPage";

import ProtectedRoute from "./ProtectedRoute";
import PermissionRoute from "./PermissionRoute";
import ApprovalWorkflowDetailsPage from "../features/approval_workflows/pages/ApprovalWorkflowDetailsPage";
import SupplierProtectedRoute from "./SupplierProtectedRoute";
import SupplierLoginPage from "../features/supplier_auth/pages/SupplierLoginPage";
import SupplierForgotPasswordPage from "../features/supplier_auth/pages/SupplierForgotPasswordPage";
import SupplierResetPasswordPage from "../features/supplier_auth/pages/SupplierResetPasswordPage";
import SupplierPurchaseOrdersPage from "../features/supplier_portal/pages/SupplierPurchaseOrdersPage";
import SupplierPurchaseOrderDetailsPage from "../features/supplier_portal/pages/SupplierPurchaseOrderDetailsPage";
import SupplierCreateInvoicePage from "../features/supplier_portal/pages/SupplierCreateInvoicePage";
import SupplierSetupPasswordPage from "../features/supplier_auth/pages/SupplierSetupPasswordPage";
import SupplierPortalLayout from "../features/supplier_portal/components/SupplierPortalLayout";
import SupplierInvoicesPage from "../features/supplier_portal/pages/SupplierInvoicesPage";
import SupplierInvoiceDetailsPage from "../features/supplier_portal/pages/SupplierInvoiceDetailsPage";
import SupplierPaymentsPage from "../features/supplier_portal/pages/SupplierPaymentsPage";
import PermissionsPage from "../features/permission/pages/PermissionPage";
import AuditLogsPage from "../features/audit_logs/pages/AuditLogsPage";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/company-signup" element={<CompanySignupPage />} />
      <Route path="/setup-password" element={<SetupPasswordPage />} />

      {/* SUPPLIER USER LOGIN AND PASSWORD SET AND RESET */}
      <Route path="/supplier-login" element={<SupplierLoginPage />} />
      <Route
        path="/supplier-setup-password"
        element={<SupplierSetupPasswordPage />}
      />
      <Route
        path="/supplier-forgot-password"
        element={<SupplierForgotPasswordPage />}
      />
      <Route
        path="/supplier-reset-password"
        element={<SupplierResetPasswordPage />}
      />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route
            path="/reports"
            element={
              <PermissionRoute
                requiredPermissions={[
                  "reports.pr.view",
                  "reports.po.view",
                  "reports.invoices.view",
                  "reports.payments.view",
                  "reports.outstanding_invoices.view",
                  "reports.supplier_spend.view",
                  "reports.supplier_lead_time.view",
                ]}
              >
                <ReportsPage />
              </PermissionRoute>
            }
          />

          {/* APPROVALS */}
          <Route
            path="/approvals"
            element={
              <PermissionRoute
                requiredPermissions={[
                  "pr.view",
                  "po.view",
                  "invoice.view",
                  "payment.view",
                  "pr.approve",
                  "po.approve",
                  "invoice.approve",
                  "payment.approve",
                ]}
              >
                <ApprovalQueuePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/approvals/:instanceId"
            element={
              <PermissionRoute
                requiredPermissions={[
                  "pr.view",
                  "po.view",
                  "invoice.view",
                  "payment.view",
                  "pr.approve",
                  "po.approve",
                  "invoice.approve",
                  "payment.approve",
                ]}
              >
                <ApprovalDetailPage />
              </PermissionRoute>
            }
          />

          {/* PURCHASE REQUISITION */}
          <Route
            path="/purchase-requisitions"
            element={
              <PermissionRoute requiredPermission="pr.view">
                <PurchaseRequisitionsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/purchase-requisitions/new"
            element={
              <PermissionRoute requiredPermission="pr.create">
                <CreatePurchaseRequisitionPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/purchase-requisitions/:id/edit"
            element={
              <PermissionRoute requiredPermission="pr.update">
                <EditPurchaseRequisitionPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/purchase-requisitions/:id"
            element={
              <PermissionRoute requiredPermission="pr.view">
                <PurchaseRequisitionDetailsPage />
              </PermissionRoute>
            }
          />

          {/* PURCHASE ORDERS */}
          <Route
            path="/purchase-orders"
            element={
              <PermissionRoute requiredPermission="po.view">
                <PurchaseOrdersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/purchase-orders/new"
            element={
              <PermissionRoute requiredPermission="po.create">
                <CreatePurchaseOrderPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/purchase-orders/:id/edit"
            element={
              <PermissionRoute requiredPermission="po.update">
                <EditPurchaseOrderPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/purchase-orders/from-requisition/:requisitionId"
            element={
              <PermissionRoute requiredPermission="po.create">
                <CreatePurchaseOrderFromPRPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/purchase-orders/:id"
            element={
              <PermissionRoute requiredPermission="po.view">
                <PurchaseOrderDetailsPage />
              </PermissionRoute>
            }
          />

          {/* SUPPLIERS */}
          <Route
            path="/suppliers"
            element={
              <PermissionRoute requiredPermission="suppliers.view">
                <SuppliersPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/suppliers/:supplierId"
            element={
              <PermissionRoute requiredPermission="suppliers.view">
                <SupplierDetailsPage />
              </PermissionRoute>
            }
          />

          {/* DEPARTMENTS */}
          <Route
            path="/departments"
            element={
              <PermissionRoute requireAdmin>
                <DepartmentsPage />
              </PermissionRoute>
            }
          />

          {/* EXCHANGE RATES */}
          <Route
            path="/exchange-rates"
            element={
              <PermissionRoute requiredPermission="exchange_rates.view">
                <ExchangeRatesPage />
              </PermissionRoute>
            }
          />

          {/* ROLES */}
          <Route
            path="/roles"
            element={
              <PermissionRoute requireAdmin>
                <RolesPage />
              </PermissionRoute>
            }
          />

          {/* PERMISSIONS */}
          <Route
            path="/permissions"
            element={
              <PermissionRoute requireAdmin>
                <PermissionsPage />
              </PermissionRoute>
            }
          />

          {/* USERS */}
          <Route
            path="/users"
            element={
              <PermissionRoute requireAdmin>
                <UsersPage />
              </PermissionRoute>
            }
          />

          {/* APPROVAL WORKFLOWS */}
          <Route
            path="/approval-workflows"
            element={
              <PermissionRoute requireAdmin>
                <ApprovalWorkflowsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/approval-workflows/:workflowId"
            element={
              <PermissionRoute requireAdmin>
                <ApprovalWorkflowDetailsPage />
              </PermissionRoute>
            }
          />

          {/* INVOICE */}
          <Route
            path="/invoices"
            element={
              <PermissionRoute requiredPermission="invoice.view">
                <InvoicesPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/invoices/new"
            element={
              <PermissionRoute requiredPermission="invoice.create">
                <CreateInvoicePage />
              </PermissionRoute>
            }
          />
          <Route
            path="/invoices/:id"
            element={
              <PermissionRoute requiredPermission="invoice.view">
                <InvoiceDetailsPage />
              </PermissionRoute>
            }
          />

          {/* PAYMENT */}
          <Route
            path="/invoices/:invoiceId/payments/new"
            element={
              <PermissionRoute requiredPermission="payment.create">
                <CreatePaymentPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <PermissionRoute requiredPermission="payment.view">
                <PaymentsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/payments/:id"
            element={
              <PermissionRoute requiredPermission="payment.view">
                <PaymentDetailsPage />
              </PermissionRoute>
            }
          />

          {/* REPORTS */}
          <Route
            path="/reports/outstanding-invoices/:invoiceId"
            element={
              <PermissionRoute requiredPermission="reports.outstanding_invoices.view">
                <OutstandingInvoiceDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/reports/supplier-spend/:supplierId"
            element={
              <PermissionRoute requiredPermission="reports.supplier_spend.view">
                <SupplierSpendDetailsPage />
              </PermissionRoute>
            }
          />
          <Route
            path="/reports/supplier-lead-time/:poId"
            element={
              <PermissionRoute requiredPermission="reports.supplier_lead_time.view">
                <SupplierLeadTimeDetailsPage />
              </PermissionRoute>
            }
          />

          {/* AUDIT LOGS */}
          <Route
            path="/audit-logs"
            element={
              <PermissionRoute requiredPermission="audit_logs.view">
                <AuditLogsPage />
              </PermissionRoute>
            }
          />
        </Route>
      </Route>

      {/* SUPPLIER AUTH PROTECTED ROUTE */}
      <Route element={<SupplierProtectedRoute />}>
        <Route path="/supplier-portal" element={<SupplierPortalLayout />}>
          <Route index element={<Navigate to="purchase-orders" replace />} />

          <Route
            path="purchase-orders"
            element={<SupplierPurchaseOrdersPage />}
          />
          <Route
            path="purchase-orders/:id"
            element={<SupplierPurchaseOrderDetailsPage />}
          />
          <Route
            path="purchase-orders/:id/create-invoice"
            element={<SupplierCreateInvoicePage />}
          />
          <Route path="invoices" element={<SupplierInvoicesPage />} />
          <Route path="invoices/:id" element={<SupplierInvoiceDetailsPage />} />
          <Route path="payments" element={<SupplierPaymentsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
