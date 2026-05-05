import type { ReportType } from "../components/ReportTabs";
import type { ReportTableColumn } from "../components/ReportTable";

import { getReport, exportReport } from "../api/reportApi";

import {
  prColumns,
  poColumns,
  invoiceColumns,
  outstandingInvoiceColumns,
  paymentColumns,
  supplierSpendColumns,
  supplierLeadTimeColumns,
} from "./reportColumns";

import type {
  PaginatedReportResponse,
  PRReportItem,
  POReportItem,
  InvoiceReportItem,
  OutstandingInvoiceReportItem,
  PaymentReportItem,
  SupplierSpendReportItem,
  SupplierLeadTimeReportItem,
  ReportFilters,
  ReportFilterConfig,
  ReportSummaryCardConfig,
} from "../types/report.types";

type ReportRegistryItem<T> = {
  title: string;
  description: string;
  isEnabled: boolean;
  columns: ReportTableColumn<T>[];
  filters: ReportFilterConfig[];
  summaryCards?: ReportSummaryCardConfig<T>[];
  fetchReport?: (filters: ReportFilters) => Promise<PaginatedReportResponse<T>>;

  exportCSV?: (filters: ReportFilters) => Promise<Blob>;
  exportExcel?: (filters: ReportFilters) => Promise<Blob>;
  csvFilename: string;
  excelFilename: string;
  emptyMessage: string;
};

export const reportRegistry = {
  "purchase-requisitions": {
    title: "Purchase Requisition Report",
    description: "Item-level purchase requisition report.",
    isEnabled: true,
    columns: prColumns,
    filters: [
      { type: "date_range" },
      { type: "status", label: "PR Status" },
      { type: "department" },
    ],
    summaryCards: [
      { label: "Total Records", type: "count", format: "number" },
      {
        label: "Total PR Value",
        field: "line_total",
        type: "sum",
        format: "currency",
      },
    ],
    fetchReport: (filters) =>
      getReport<PRReportItem>("/reports/purchase-requisitions/", filters),
    exportCSV: (filters) =>
      exportReport("/reports/purchase-requisitions/export/csv", filters),
    exportExcel: (filters) =>
      exportReport("/reports/purchase-requisitions/export/excel", filters),
    csvFilename: "pr-report.csv",
    excelFilename: "pr-report.xlsx",
    emptyMessage:
      "No purchase requisitions match your current filters. Try clearing filters or selecting a wider date range.",
  },

  "purchase-orders": {
    title: "Purchase Order Report",
    description: "Item-level purchase order report.",
    isEnabled: true,
    columns: poColumns,
    filters: [
      { type: "date_range" },
      { type: "status", label: "PO Status" },
      { type: "supplier" },
    ],
    summaryCards: [
      { label: "Total Records", type: "count", format: "number" },
      {
        label: "Total PO Value",
        field: "line_total",
        type: "sum",
        format: "currency",
      },
    ],
    fetchReport: (filters) =>
      getReport<POReportItem>("/reports/purchase-orders/", filters),
    exportCSV: (filters) =>
      exportReport("/reports/purchase-orders/export/csv", filters),
    exportExcel: (filters) =>
      exportReport("/reports/purchase-orders/export/excel", filters),
    csvFilename: "po-report.csv",
    excelFilename: "po-report.xlsx",
    emptyMessage:
      "No purchase orders match your current filters. Try clearing filters or selecting a wider date range.",
  },

  invoices: {
    title: "Invoice Report",
    description: "Item-level invoice report.",
    isEnabled: true,
    columns: invoiceColumns,
    filters: [
      { type: "date_range" },
      { type: "status", label: "Invoice Status" },
      { type: "supplier" },
    ],
    summaryCards: [
      { label: "Total Records", type: "count", format: "number" },
      {
        label: "Total Invoice Value",
        field: "line_total",
        type: "sum",
        format: "currency",
      },
    ],
    fetchReport: (filters) =>
      getReport<InvoiceReportItem>("/reports/invoices/", filters),
    exportCSV: (filters) =>
      exportReport("/reports/invoices/export/csv", filters),
    exportExcel: (filters) =>
      exportReport("/reports/invoices/export/excel", filters),
    csvFilename: "invoice-report.csv",
    excelFilename: "invoice-report.xlsx",
    emptyMessage:
      "No invoices match your current filters. Try clearing filters or selecting a wider date range.",
  },

  "outstanding-invoices": {
    title: "Outstanding Invoice Report",
    description: "Unpaid and partially paid invoice balances.",
    isEnabled: true,
    columns: outstandingInvoiceColumns,
    filters: [
      { type: "date_range" },
      { type: "status", label: "Invoice Status" },
      { type: "supplier" },
    ],
    summaryCards: [
      { label: "Total Records", type: "count", format: "number" },
      {
        label: "Outstanding Balance",
        field: "outstanding_amount",
        type: "sum",
        format: "currency",
      },
    ],
    fetchReport: (filters) =>
      getReport<OutstandingInvoiceReportItem>(
        "/reports/outstanding-invoices/",
        filters,
      ),
    exportCSV: (filters) =>
      exportReport("/reports/outstanding-invoices/export/csv", filters),
    exportExcel: (filters) =>
      exportReport("/reports/outstanding-invoices/export/excel", filters),
    csvFilename: "outstanding-invoices-report.csv",
    excelFilename: "outstanding-invoices-report.xlsx",
    emptyMessage:
      "No outstanding invoices match your current filters. Try clearing filters or selecting a wider date range.",
  },

  payments: {
    title: "Payment Report",
    description: "Readable payment report with invoice and supplier details.",
    isEnabled: true,
    columns: paymentColumns,
    filters: [
      { type: "date_range" },
      { type: "status", label: "Payment Status" },
      { type: "supplier" },
      { type: "payment_method" },
    ],
    summaryCards: [
      { label: "Total Records", type: "count", format: "number" },
      { label: "Total Paid", field: "amount", type: "sum", format: "currency" },
    ],
    fetchReport: (filters) =>
      getReport<PaymentReportItem>("/reports/payments/", filters),
    exportCSV: (filters) =>
      exportReport("/reports/payments/export/csv", filters),
    exportExcel: (filters) =>
      exportReport("/reports/payments/export/excel", filters),
    csvFilename: "payment-report.csv",
    excelFilename: "payment-report.xlsx",
    emptyMessage:
      "No payments match your current filters. Try clearing filters or selecting a wider date range.",
  },

  "supplier-spend": {
    title: "Supplier Spend Report",
    description: "Supplier-level spend summary.",
    isEnabled: true,
    columns: supplierSpendColumns,
    filters: [{ type: "date_range" }, { type: "supplier" }],
    summaryCards: [
      { label: "Suppliers", type: "count", format: "number" },
      {
        label: "Invoice Value",
        field: "total_invoice_amount",
        type: "sum",
        format: "currency",
      },
      {
        label: "Paid Amount",
        field: "total_paid_amount",
        type: "sum",
        format: "currency",
      },
      {
        label: "Outstanding",
        field: "outstanding_amount",
        type: "sum",
        format: "currency",
      },
    ],
    fetchReport: (filters) =>
      getReport<SupplierSpendReportItem>("/reports/supplier-spend/", filters),
    exportCSV: (filters) =>
      exportReport("/reports/supplier-spend/export/csv", filters),
    exportExcel: (filters) =>
      exportReport("/reports/supplier-spend/export/excel", filters),
    csvFilename: "supplier-spend-report.csv",
    excelFilename: "supplier-spend-report.xlsx",
    emptyMessage:
      "No supplier spend records match your current filters. Try clearing filters or selecting a wider date range.",
  },

  "supplier-lead-time": {
    title: "Supplier Lead Time Report",
    description: "Supplier delivery performance summary.",
    isEnabled: true,
    columns: supplierLeadTimeColumns,
    filters: [{ type: "date_range" }, { type: "supplier" }],
    summaryCards: [
      { label: "Records", type: "count", format: "number" },
      {
        label: "Average Lead Time",
        field: "lead_time_days",
        type: "average",
        format: "days",
      },
    ],
    fetchReport: (filters) =>
      getReport<SupplierLeadTimeReportItem>(
        "/reports/supplier-lead-time/",
        filters,
      ),
    exportCSV: (filters) =>
      exportReport("/reports/supplier-lead-time/export/csv", filters),
    exportExcel: (filters) =>
      exportReport("/reports/supplier-lead-time/export/excel", filters),
    csvFilename: "supplier-lead-time-report.csv",
    excelFilename: "supplier-lead-time-report.xlsx",
    emptyMessage:
      "No supplier lead time records match your current filters. Try clearing filters or selecting a wider date range.",
  },
} satisfies Partial<Record<ReportType, ReportRegistryItem<any>>>;
