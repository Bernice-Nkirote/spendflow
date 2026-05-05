import { Link } from "react-router-dom";
import ReportStatusBadge from "../components/ReportStatusBadge";
import type { ReportTableColumn } from "../components/ReportTable";
import type {
  PRReportItem,
  POReportItem,
  InvoiceReportItem,
  OutstandingInvoiceReportItem,
  PaymentReportItem,
  SupplierSpendReportItem,
  SupplierLeadTimeReportItem,
} from "../types/report.types";

import {
  formatDate,
  formatMoney,
  formatQuantity,
} from "../utils/reportFormatter";

// PR COLUMNS
export const prColumns: ReportTableColumn<PRReportItem>[] = [
  {
    header: "PR Number",
    accessor: "pr_number",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap font-medium">
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Title",
    accessor: "title",
    render: (value) => (
      <span
        className="block max-w-[180px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Requester",
    accessor: "requested_by_name",
    render: (value) => (
      <span
        className="block max-w-[140px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Item",
    accessor: "item_name",
    render: (value) => (
      <span
        className="block max-w-[200px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Qty",
    accessor: "quantity",
    sortable: true,
    align: "right",
    render: (value) => formatQuantity(value as string),
  },
  {
    header: "Unit Price",
    accessor: "unit_price",
    sortable: true,
    align: "right",
    render: (value, row) => formatMoney(value as string, row.currency),
  },
  {
    header: "Line Total",
    accessor: "line_total",
    sortable: true,
    align: "right",
    render: (value, row) => formatMoney(value as string, row.currency),
  },
  {
    header: "PR Total",
    accessor: "pr_total_amount",
    sortable: true,
    align: "right",
    render: (value, row) => formatMoney(value as string, row.currency),
  },
  {
    header: "Status",
    accessor: "status",
    render: (value) => <ReportStatusBadge status={String(value ?? "")} />,
  },
  {
    header: "Created",
    accessor: "created_at",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap">{formatDate(value as string)}</span>
    ),
  },
  {
    header: "Actions",
    accessor: "pr_id",
    render: (value) => (
      <Link
        to={`/purchase-requisitions/${value}`}
        className="whitespace-nowrap text-sm font-medium text-primary-blue hover:underline"
      >
        View Details
      </Link>
    ),
  },
];

// PO COLUMNS
export const poColumns: ReportTableColumn<POReportItem>[] = [
  {
    header: "PO Number",
    accessor: "po_number",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap font-medium">
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Supplier",
    accessor: "supplier_name",
    sortable: true,
    render: (value) => (
      <span
        className="block max-w-[160px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Item",
    accessor: "item_name",
    render: (value) => (
      <span
        className="block max-w-[200px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Qty",
    accessor: "quantity",
    sortable: true,
    align: "right",
    render: (value) => formatQuantity(value as string),
  },
  {
    header: "Unit Price",
    accessor: "unit_price",
    sortable: true,
    align: "right",
    render: (value, row) => formatMoney(value as string, row.currency),
  },
  {
    header: "Line Total",
    accessor: "line_total",
    sortable: true,
    align: "right",
    render: (value, row) => formatMoney(value as string, row.currency),
  },
  {
    header: "PO Total",
    accessor: "po_total_amount",
    sortable: true,
    align: "right",
    render: (value, row) => formatMoney(value as string, row.currency),
  },
  {
    header: "Status",
    accessor: "status",
    render: (value) => <ReportStatusBadge status={String(value ?? "")} />,
  },
  {
    header: "Created",
    accessor: "created_at",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap">{formatDate(value as string)}</span>
    ),
  },
];

// INVOICE COLUMNS
export const invoiceColumns: ReportTableColumn<InvoiceReportItem>[] = [
  {
    header: "Invoice No.",
    accessor: "invoice_number",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap font-medium">
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Supplier",
    accessor: "supplier_name",
    sortable: true,
    render: (value) => (
      <span
        className="block max-w-[160px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "PO Number",
    accessor: "po_number",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap">{String(value ?? "-")}</span>
    ),
  },
  {
    header: "Item",
    accessor: "item_description",
    render: (value) => (
      <span
        className="block max-w-[220px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Qty",
    accessor: "quantity",
    align: "right",
    sortable: true,
    render: (value) => formatQuantity(value as string),
  },
  {
    header: "Unit Price",
    accessor: "unit_price",
    align: "right",
    sortable: true,
    render: (value) => formatMoney(value as string),
  },
  {
    header: "Line Total",
    accessor: "line_total",
    align: "right",
    sortable: true,
    render: (value) => formatMoney(value as string),
  },
  {
    header: "Invoice Total",
    accessor: "invoice_total_amount",
    align: "right",
    sortable: true,
    render: (value) => formatMoney(value as string),
  },
  {
    header: "Status",
    accessor: "status",
    render: (value) => <ReportStatusBadge status={String(value ?? "")} />,
  },
  {
    header: "Created",
    accessor: "created_at",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap">{formatDate(value as string)}</span>
    ),
  },
];

// OUTSTANDING INVOICE COLUMNS
export const outstandingInvoiceColumns: ReportTableColumn<OutstandingInvoiceReportItem>[] =
  [
    {
      header: "Invoice No.",
      accessor: "invoice_number",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap font-medium">
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      header: "Supplier",
      accessor: "supplier_name",
      sortable: true,
      render: (value) => (
        <span
          className="block max-w-[160px] truncate"
          title={String(value ?? "")}
        >
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      header: "PO Number",
      accessor: "po_number",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap">{String(value ?? "-")}</span>
      ),
    },
    {
      header: "Total Amount",
      accessor: "total_amount",
      align: "right",
      sortable: true,
      render: (value) => formatMoney(value as string),
    },
    {
      header: "Amount Paid",
      accessor: "amount_paid",
      align: "right",
      sortable: true,
      render: (value) => formatMoney(value as string),
    },
    {
      header: "Outstanding",
      accessor: "outstanding_amount",
      align: "right",
      sortable: true,
      render: (value) => formatMoney(value as string),
    },
    {
      header: "Status",
      accessor: "status",
      render: (value) => <ReportStatusBadge status={String(value ?? "")} />,
    },
    {
      header: "Created",
      accessor: "created_at",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap">{formatDate(value as string)}</span>
      ),
    },
  ];

// PAYMENT INVOICE COLUMNS
export const paymentColumns: ReportTableColumn<PaymentReportItem>[] = [
  {
    header: "Reference",
    accessor: "payment_reference",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap font-medium">
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Invoice No.",
    accessor: "invoice_number",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap">{String(value ?? "-")}</span>
    ),
  },
  {
    header: "Supplier",
    accessor: "supplier_name",
    sortable: true,
    render: (value) => (
      <span
        className="block max-w-[160px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Amount",
    accessor: "amount",
    align: "right",
    sortable: true,
    render: (value) => formatMoney(value as string),
  },
  {
    header: "Method",
    accessor: "payment_method",
    render: (value) => (
      <span className="whitespace-nowrap">{String(value ?? "-")}</span>
    ),
  },
  {
    header: "Created By",
    accessor: "created_by_name",
    render: (value) => (
      <span
        className="block max-w-[140px] truncate"
        title={String(value ?? "")}
      >
        {String(value ?? "-")}
      </span>
    ),
  },
  {
    header: "Status",
    accessor: "status",
    render: (value) => <ReportStatusBadge status={String(value ?? "")} />,
  },
  {
    header: "Created",
    accessor: "created_at",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap">{formatDate(value as string)}</span>
    ),
  },
  {
    header: "Paid At",
    accessor: "paid_at",
    sortable: true,
    render: (value) => (
      <span className="whitespace-nowrap">
        {value ? formatDate(value as string) : "-"}
      </span>
    ),
  },
];

// SUPPLIER SPEND COLUMNS
export const supplierSpendColumns: ReportTableColumn<SupplierSpendReportItem>[] =
  [
    {
      header: "Supplier",
      accessor: "supplier_name",
      sortable: true,
      render: (value) => (
        <span
          className="block max-w-[180px] truncate font-medium"
          title={String(value ?? "")}
        >
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      header: "Invoice Total",
      accessor: "total_invoice_amount",
      align: "right",
      sortable: true,
      render: (value) => formatMoney(value as string),
    },
    {
      header: "Paid Total",
      accessor: "total_paid_amount",
      align: "right",
      sortable: true,
      render: (value) => formatMoney(value as string),
    },
    {
      header: "Outstanding",
      accessor: "outstanding_amount",
      align: "right",
      sortable: true,
      render: (value) => formatMoney(value as string),
    },
    {
      header: "Invoices",
      accessor: "invoice_count",
      align: "right",
      sortable: true,
    },
    {
      header: "Payments",
      accessor: "payment_count",
      align: "right",
      sortable: true,
    },
  ];

// SUPPLIER LEAD TIME COLUMNS
export const supplierLeadTimeColumns: ReportTableColumn<SupplierLeadTimeReportItem>[] =
  [
    {
      header: "PO Number",
      accessor: "po_number",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap font-medium">
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      header: "Supplier",
      accessor: "supplier_name",
      sortable: true,
      render: (value) => (
        <span
          className="block max-w-[180px] truncate"
          title={String(value ?? "")}
        >
          {String(value ?? "-")}
        </span>
      ),
    },
    {
      header: "Invoice No.",
      accessor: "invoice_number",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap">{String(value ?? "-")}</span>
      ),
    },
    {
      header: "Issued",
      accessor: "issued_at",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap">
          {value ? formatDate(value as string) : "-"}
        </span>
      ),
    },
    {
      header: "Invoice Created",
      accessor: "invoice_created_at",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap">
          {value ? formatDate(value as string) : "-"}
        </span>
      ),
    },
    {
      header: "Lead Time",
      accessor: "lead_time_days",
      align: "right",
      sortable: true,
      render: (value) => (
        <span className="whitespace-nowrap">
          {value === null || value === undefined
            ? "-"
            : `${Number(value).toFixed(1)} days`}
        </span>
      ),
    },
  ];
