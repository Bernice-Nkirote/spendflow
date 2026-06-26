import { NavLink, Outlet } from "react-router-dom";
import { useSupplierInactivityLogout } from "../../supplier_auth/hooks/useSupplierInactivityLogout";

import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

function SupplierPortalLayout() {
  const { isSessionWarningOpen, staySignedIn, logoutNow } =
    useSupplierInactivityLogout();

  function handleLogout() {
    localStorage.removeItem("supplier_access_token");
    localStorage.removeItem("supplier_refresh_token");
    localStorage.removeItem("supplier_user");
    window.location.href = "/supplier-login";
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-primary-blue text-white shadow-sm"
        : "text-primary-black hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-primary-white">
      <ConfirmDialog
        isOpen={isSessionWarningOpen}
        title="Session expiring soon"
        message="You have been inactive. Your supplier session will expire soon. Choose Stay Signed In to continue working."
        confirmLabel="Stay Signed In"
        cancelLabel="Logout"
        variant="warning"
        onConfirm={staySignedIn}
        onCancel={logoutNow}
      />
      <header className="sticky top-0 z-40 border-b bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/tendaflow-app-icon.svg"
              alt="Tendaflow"
              className="h-10 w-10 rounded-xl object-contain shadow-sm"
            />
            <div>
              <h1 className="text-xl font-bold text-primary-blue">Tendaflow</h1>
              <p className="text-sm text-primary-gray">Supplier Portal</p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <NavLink
              to="/supplier-portal/purchase-orders"
              className={navLinkClass}
            >
              Purchase Orders
            </NavLink>

            <NavLink to="/supplier-portal/invoices" className={navLinkClass}>
              Invoices
            </NavLink>

            <NavLink to="/supplier-portal/payments" className={navLinkClass}>
              Payments
            </NavLink>

            <NavLink to="/supplier-portal/guide" className={navLinkClass}>
              Guide
            </NavLink>

            <NavLink to="/supplier-portal/assistant" className={navLinkClass}>
              Assistant
            </NavLink>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}

export default SupplierPortalLayout;
