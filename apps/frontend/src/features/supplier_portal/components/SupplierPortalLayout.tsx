import { NavLink, Outlet } from "react-router-dom";

function SupplierPortalLayout() {
  function handleLogout() {
    localStorage.removeItem("supplier_access_token");
    window.location.href = "/supplier-login";
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${
      isActive
        ? "bg-primary-blue text-white"
        : "text-primary-black hover:bg-gray-100"
    }`;

  return (
    <div className="min-h-screen bg-primary-white">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl font-bold text-primary-blue">SpendFlow</h1>
            <p className="text-sm text-primary-gray">Supplier Portal</p>
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

            <button
              type="button"
              onClick={handleLogout}
              className="whitespace-nowrap rounded-lg border px-3 py-2 text-sm font-semibold text-primary-black hover:bg-gray-50"
            >
              Logout
            </button>
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
