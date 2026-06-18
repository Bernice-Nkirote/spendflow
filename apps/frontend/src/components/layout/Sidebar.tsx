import { NavLink } from "react-router-dom";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

function Sidebar({ isOpen, onClose }: SidebarProps) {
  const currentYear = new Date().getFullYear();

  const groupedNavItems = [
    {
      section: "Main",
      items: [{ label: "Dashboard", path: "/" }],
    },
    {
      section: "Procurement",
      items: [
        { label: "Purchase Requisitions", path: "/purchase-requisitions" },
        { label: "Purchase Orders", path: "/purchase-orders" },
        { label: "Suppliers", path: "/suppliers" },
        { label: "Invoices", path: "/invoices" },
        { label: "Payments", path: "/payments" },
      ],
    },
    {
      section: "Workflow",
      items: [
        { label: "Approvals", path: "/approvals" },
        { label: "Approval Workflows", path: "/approval-workflows" },
      ],
    },
    {
      section: "Reporting",
      items: [
        { label: "Reports", path: "/reports" },
        { label: "Audit Logs", path: "/audit-logs" },
      ],
    },
    {
      section: "Help",
      items: [
        { label: "Tenda Assistant", path: "/assistant" },
        { label: "User Guide", path: "/user-guide" },
      ],
    },
    {
      section: "Administration",
      items: [
        { label: "Exchange Rates", path: "/exchange-rates" },
        { label: "Departments", path: "/departments" },
        { label: "Roles", path: "/roles" },
        { label: "Permissions", path: "/permissions" },
        { label: "Users", path: "/users" },
      ],
    },
  ];

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
          fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 transform flex-col overflow-hidden
           bg-[#274C77] text-white transition-transform duration-200
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-[4px_0_12px_rgba(0,0,0,0.05)]
        `}
      >
        <div className="border-b border-white/20 px-5 py-5">
          <img
            src="/tendaflow-sidebar-logo-primary-polished.svg"
            alt="Tendaflow"
            className="h-auto w-full max-w-[190px] rounded-2xl object-contain shadow-[0_8px_20px_rgba(0,0,0,0.18)]"
          />

          <p className="mt-3 text-sm font-medium text-white/70">
            Procurement System
          </p>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-4 py-5 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.25)_transparent]">
          {groupedNavItems.map((group) => (
            <div key={group.section}>
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
                {group.section}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      [
                        "block rounded-xl px-3.5 py-2.5 text-sm font-medium transition",
                        isActive
                          ? "border border-white/10 bg-white/15 text-white shadow-sm"
                          : "text-white/75 hover:bg-white/10 hover:text-white",
                      ].join(" ")
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="shrink-0 border-t border-white/10 px-5 py-4 text-xs text-white/55">
          <p className="font-semibold text-white/70">Gura Systems</p>
          <p className="mt-1">Tendaflow © {currentYear}</p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
