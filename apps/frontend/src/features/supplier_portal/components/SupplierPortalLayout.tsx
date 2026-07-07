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
    `whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 ${
      isActive
        ? "border-[#54ACBF]/45 bg-[#26658C] text-white shadow-sm shadow-[#26658C]/20"
        : "border-transparent text-[#011C40] hover:-translate-y-0.5 hover:border-[#A7EBF2]/70 hover:bg-white/55 hover:text-[#26658C] hover:shadow-sm"
    }`;

  return (
    <div className="module-theme module-suppliers app-shell-bg min-h-screen">
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
      <header className="sticky top-0 z-40 border-b border-white/65 bg-white/72 shadow-[0_16px_42px_rgba(1,28,64,0.10)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#A7EBF2]/60 bg-white/70 shadow-sm shadow-[#011C40]/10 backdrop-blur">
              <img
                src="/tendaflow-auth-logo.svg"
                alt="Tendaflow"
                className="h-9 w-9 object-contain"
              />
            </span>
            <div>
              <h1 className="bg-gradient-to-r from-[#011C40] via-[#26658C] to-[#54ACBF] bg-clip-text text-xl font-bold text-transparent">
                Tendaflow
              </h1>
              <p className="text-sm font-medium text-primary-gray">
                Supplier Portal
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/60 bg-white/45 p-2 shadow-sm backdrop-blur">
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
