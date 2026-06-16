import type { ReportType } from "../components/ReportTabs";

export type ReportFilterType =
  | "date_range"
  | "status"
  | "supplier"
  | "department"
  | "payment_method";

export type ReportFilterConfig = {
  type: ReportFilterType;
  label?: string;
};

export type ReportFilterOption = {
  label: string;
  value: string;
};

export type ReportStatusOptions = Partial<Record<ReportType, string[]>>;

export type ReportPaymentMethodOptions = string[];

export type ReportFilters = {
  date_from?: string;
  date_to?: string;
  status?: string;
  supplier_id?: string;
  department_id?: string;
  payment_method?: string;
  page?: number;
  page_size?: number;
  skip?: number;
  limit?: number;
};

export type ReportSummaryCardConfig<T> = {
  label: string;
  field?: keyof T;
  fallbackField?: keyof T;
  type: "count" | "sum" | "average";
  format?: "number" | "currency" | "days";
};

// PR REPORT ITEM
export type PRReportItem = {
  pr_id: string;
  pr_number: string;
  title: string;
  department_id: string;
  department_name: string;
  requested_by_id: string;
  requested_by_name: string;
  item_id: string;
  item_name: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  base_line_total: string | null;
  pr_total_amount: string;
  currency: string;
  exchange_rate: string | null;
  base_currency: string | null;
  base_amount: string | null;
  exchange_rate_date: string | null;
  status: string;
  created_at: string;
};

// PO REPORT ITEM
export type POReportItem = {
  po_id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  item_id: string;
  item_name: string;
  quantity: string;
  unit_price: string | null;
  line_total: string | null;
  base_line_total: string | null;
  po_total_amount: string | null;
  currency: string;
  exchange_rate: string | null;
  base_currency: string | null;
  base_amount: string | null;
  exchange_rate_date: string | null;
  status: string;
  created_at: string;
};

// INVOICE REPORT ITEM
export type InvoiceReportItem = {
  invoice_id: string;
  invoice_number: string;

  supplier_id: string;
  supplier_name: string | null;

  purchase_order_id: string | null;
  po_number: string | null;

  item_id: string;
  item_description: string;
  quantity: string;
  unit_price: string;
  line_total: string;
  base_line_total: string | null;

  invoice_total_amount: string;
  currency: string | null;
  exchange_rate: string | null;
  base_currency: string | null;
  base_amount: string | null;
  exchange_rate_date: string | null;
  status: string;
  created_at: string;
};

// OUTSTANDING INVOICE REPORT ITEM
export type OutstandingInvoiceReportItem = {
  invoice_id: string;
  invoice_number: string;

  supplier_id: string;
  supplier_name: string | null;

  purchase_order_id: string | null;
  po_number: string | null;

  total_amount: string;
  amount_paid: string;
  outstanding_amount: string;
  currency: string | null;
  base_currency: string | null;
  base_total_amount: string | null;
  base_amount_paid: string | null;
  base_outstanding_amount: string | null;

  status: string;
  created_at: string;
};

// PAYMENTS REPORT ITEM
export type PaymentReportItem = {
  payment_id: string;
  payment_reference: string | null;

  invoice_id: string;
  invoice_number: string;

  supplier_id: string;
  supplier_name: string | null;

  amount: string;
  currency: string | null;
  exchange_rate: string | null;
  base_currency: string | null;
  base_amount: string | null;
  exchange_rate_date: string | null;
  payment_method: string | null;
  status: string;

  created_by_id: string | null;
  created_by_name: string | null;

  created_at: string;
  paid_at: string | null;
};

// SUPPLIER SPEND REPORT ITEM
export type SupplierSpendReportItem = {
  supplier_id: string;
  supplier_name: string;
  supplier_category: string | null;
  supplier_sub_category: string | null;

  total_invoice_amount: string;
  total_paid_amount: string;
  outstanding_amount: string;

  base_currency: string | null;
  base_total_invoice_amount: string | null;
  base_total_paid_amount: string | null;
  base_outstanding_amount: string | null;

  invoice_count: number;
  payment_count: number;
};

// SUPPLIER LEAD REPORT ITEM
export type SupplierLeadTimeReportItem = {
  po_id: string;
  po_number: string;

  supplier_id: string;
  supplier_name: string;

  invoice_id: string | null;
  invoice_number: string | null;

  issued_at: string | null;
  invoice_created_at: string | null;
  lead_time_days: number | null;
};

export type PaginatedReportResponse<T> = {
  rows: T[];
  total_count: number;
};
