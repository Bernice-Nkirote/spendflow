import { Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/auth/LoginPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import CompanySignupPage from "../features/auth/CompanySignupPage";
import PurchaseRequisitionDetailsPage from "../features/purchase_requisition/pages/PurchaseRequisitionDetailsPage";
import PurchaseOrderDetailsPage from "../features/purchase_orders/pages/PurchaseOrderDetailsPage";
import InvoiceDetailsPage from "../features/invoices/pages/invoiceDetailsPage";
import PaymentDetailsPage from "../features/payments/pages/paymentDetailsPage";
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
import SuppliersPage from "../features/suppliers/pages/SuppliersPage";
import SupplierDetailsPage from "../features/suppliers/pages/SupplierDetailsPage";
import ProtectedRoute from "./ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/company-signup" element={<CompanySignupPage />} />

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

          {/* INVOICE AND PAYMENT */}
          <Route path="/invoices/:id" element={<InvoiceDetailsPage />} />
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
