export type NavigationSource =
  | "reports"
  | "dashboard"
  | "approvals"
  | "purchase-requisitions"
  | "purchase-orders"
  | "invoices"
  | "payments"
  | "suppliers"
  | "audit-logs";

export type NavigationState = {
  from?: NavigationSource;
  report?: string;
  previousPath?: string;
  label?: string;
};

export const navigationLabels: Record<NavigationSource, string> = {
  reports: "Reports",
  dashboard: "Dashboard",
  approvals: "Approvals",
  "purchase-requisitions": "Purchase Requisitions",
  "purchase-orders": "Purchase Orders",
  invoices: "Invoices",
  payments: "Payments",
  suppliers: "Suppliers",
  "audit-logs": "Audit Logs",
};

export const navigationPaths: Record<NavigationSource, string> = {
  reports: "/reports",
  dashboard: "/",
  approvals: "/approvals",
  "purchase-requisitions": "/purchase-requisitions",
  "purchase-orders": "/purchase-orders",
  invoices: "/invoices",
  payments: "/payments",
  suppliers: "/suppliers",
  "audit-logs": "/audit-logs",
};

export function getBackNavigation(state?: NavigationState | null) {
  if (!state?.from) {
    return {
      label: "Back",
      to: undefined,
    };
  }

  return {
    label: state.label ?? `Back to ${navigationLabels[state.from]}`,
    to: navigationPaths[state.from],
  };
}
