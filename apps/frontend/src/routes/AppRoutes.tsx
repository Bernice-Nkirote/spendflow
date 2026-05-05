import { Route, Routes } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import LoginPage from "../features/auth/LoginPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import CompanySignupPage from "../features/auth/CompanySignupPage";
import PurchaseRequisitionDetailsPage from "../features/purchase_requisition/pages/PurchaseRequisitionDetailsPage";
import DashboardPage from "../features/dashboard/pages/DashboardPage";

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
          <Route
            path="/purchase-requisitions/:id"
            element={<PurchaseRequisitionDetailsPage />}
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
