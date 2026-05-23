import type { ReportType } from "../components/ReportTabs";

export const reportConfig = {
  "purchase-requisitions": {
    title: "Purchase Requisition Report",
    description: "Item-level purchase requisition report.",
    isEnabled: true,
  },
  "purchase-orders": {
    title: "Purchase Order Report",
    description: "Item-level purchase order report.",
    isEnabled: true,
  },
  invoices: {
    title: "Invoice Report",
    description: "Item-level invoice report.",
    isEnabled: true,
  },
  "outstanding-invoices": {
    title: "Outstanding Invoice Report",
    description: "Unpaid and partially paid invoice balances.",
    isEnabled: true,
  },
  payments: {
    title: "Payment Report",
    description: "Readable payment report with invoice and supplier details.",
    isEnabled: true,
  },
  "supplier-spend": {
    title: "Supplier Spend Report",
    description: "Supplier-level spend summary.",
    isEnabled: true,
  },
  "supplier-lead-time": {
    title: "Supplier Lead Time Report",
    description: "Supplier delivery performance summary.",
    isEnabled: true,
  },
} satisfies Record<
  ReportType,
  {
    title: string;
    description: string;
    isEnabled: boolean;
  }
>;
