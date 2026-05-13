import { Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/auth/LoginPage";
import CompanySignupPage from "../features/auth/CompanySignupPage";
import SetupPasswordPage from "../features/auth/SetupPasswordPage";
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

import SuppliersPage from "../features/suppliers/pages/SuppliersPage";
import SupplierDetailsPage from "../features/suppliers/pages/SupplierDetailsPage";
import DepartmentsPage from "../features/Departments/pages/DepartmentsPage";
import RolesPage from "../features/roles/pages/RolesPage";
import UsersPage from "../features/users/pages/UsersPage";
import ProtectedRoute from "./ProtectedRoute";
import ApprovalWorkflowDetailsPage from "../features/approval_workflows/pages/ApprovalWorkflowDetailsPage";
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/company-signup" element={<CompanySignupPage />} />
      <Route path="/setup-password" element={<SetupPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* APPROVALS */}
          <Route path="/approvals" element={<ApprovalQueuePage />} />
          <Route
            path="/approvals/:instanceId"
            element={<ApprovalDetailPage />}
          />

          {/* PURCHASE REQUISITION */}
          <Route
            path="/purchase-requisitions"
            element={<PurchaseRequisitionsPage />}
          />
          <Route
            path="/purchase-requisitions/new"
            element={<CreatePurchaseRequisitionPage />}
          />
          <Route
            path="/purchase-requisitions/:id/edit"
            element={<EditPurchaseRequisitionPage />}
          />
          <Route
            path="/purchase-requisitions/:id"
            element={<PurchaseRequisitionDetailsPage />}
          />

          {/* PURCHASE ORDERS */}
          <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route
            path="/purchase-orders/new"
            element={<CreatePurchaseOrderPage />}
          />
          <Route
            path="/purchase-orders/:id/edit"
            element={<EditPurchaseOrderPage />}
          />
          <Route
            path="/purchase-orders/from-requisition/:requisitionId"
            element={<CreatePurchaseOrderFromPRPage />}
          />
          <Route
            path="/purchase-orders/:id"
            element={<PurchaseOrderDetailsPage />}
          />

          {/* SUPPLIERS */}
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route
            path="/suppliers/:supplierId"
            element={<SupplierDetailsPage />}
          />

          {/* DEPARTMENTS */}
          <Route path="/departments" element={<DepartmentsPage />} />

          {/* ROLES */}
          <Route path="/roles" element={<RolesPage />} />

          {/* USERS */}
          <Route path="/users" element={<UsersPage />} />

          {/* APPROVAL WORKFLOWS */}
          <Route
            path="/approval-workflows"
            element={<ApprovalWorkflowsPage />}
          />
          <Route
            path="/approval-workflows/:workflowId"
            element={<ApprovalWorkflowDetailsPage />}
          />

          {/* INVOICE */}
          <Route path="/invoices" element={<InvoicesPage />} />
          <Route path="/invoices/new" element={<CreateInvoicePage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />

          {/* PAYMENT */}
          <Route
            path="/invoices/:invoiceId/payments/new"
            element={<CreatePaymentPage />}
          />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/payments/:id" element={<PaymentDetailsPage />} />

          {/* REPORTS */}
          <Route
            path="/reports/outstanding-invoices/:invoiceId"
            element={<OutstandingInvoiceDetailsPage />}
          />
          <Route
            path="/reports/supplier-spend/:supplierId"
            element={<SupplierSpendDetailsPage />}
          />
          <Route
            path="/reports/supplier-lead-time/:poId"
            element={<SupplierLeadTimeDetailsPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
