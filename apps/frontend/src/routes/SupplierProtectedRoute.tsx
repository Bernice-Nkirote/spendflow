import { Navigate, Outlet } from "react-router-dom";

function SupplierProtectedRoute() {
  const token = localStorage.getItem("supplier_access_token");

  if (!token) {
    return <Navigate to="/supplier-login" replace />;
  }

  return <Outlet />;
}

export default SupplierProtectedRoute;
