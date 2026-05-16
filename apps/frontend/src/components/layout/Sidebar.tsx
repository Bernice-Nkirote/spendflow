import { NavLink } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/" },

  { label: "Purchase Requisitions", path: "/purchase-requisitions" },
  { label: "Purchase Orders", path: "/purchase-orders" },
  { label: "Suppliers", path: "/suppliers" },
  { label: "Invoices", path: "/invoices" },
  { label: "Payments", path: "/payments" },

  { label: "Approvals", path: "/approvals" },
  { label: "Approval Workflows", path: "/approval-workflows" },

  { label: "Reports", path: "/reports" },
  { label: "Audit Logs", path: "/audit-logs" },

  { label: "Exchange Rates", path: "/exchange-rates" },
  { label: "Departments", path: "/departments" },
  { label: "Roles", path: "/roles" },
  { label: "Permissions", path: "/permissions" },
  { label: "Users", path: "/users" },
];

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 shrink-0 transform bg-primary-blue text-white overflow-y-auto transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:static lg:translate-x-0 lg:shadow-[4px_0_12px_rgba(0,0,0,0.05)]
        `}
      >
        <div className="border-b border-white/20 px-6 py-5">
          <h1 className="text-2xl font-bold">SpendFlow</h1>
          <p className="mt-1 text-sm text-white/70">Procurement System</p>
        </div>

        <nav className="space-y-1 px-4 py-6">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }: { isActive: boolean }) =>
                [
                  "block rounded-lg px-4 py-3 text-sm font-medium transition",
                  isActive
                    ? "bg-white text-primary-blue"
                    : "text-white/80 hover:bg-white/10 hover:text-white",
                ].join(" ")
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
