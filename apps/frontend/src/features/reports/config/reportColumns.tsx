import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
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

function TruncatedText({
  value,
  maxWidth = "max-w-[180px]",
  className = "",
}: {
  value: unknown;
  maxWidth?: string;
  className?: string;
}) {
  const text = String(value ?? "-");

  return (
    <span
      className={`block truncate ${maxWidth} ${className}`}
      title={text === "-" ? undefined : text}
    >
      {text}
    </span>
  );
}

function NowrapText({
  value,
  className = "",
}: {
  value: unknown;
  className?: string;
}) {
  return (
    <span className={`whitespace-nowrap ${className}`}>
      {String(value ?? "-")}
    </span>
  );
}

function ActionLink({
  to,
  state,
  label = "View",
}: {
  to: string;
  state: Record<string, string>;
  label?: string;
}) {
  return (
    <div className="flex justify-end">
      <Link to={to} state={state}>
        <Button type="button" variant="secondary" size="sm">
          {label}
        </Button>
      </Link>
    </div>
  );
}

function renderDate(value: unknown) {
  return <NowrapText value={formatDate(value as string)} />;
}

function renderStatus(value: unknown) {
  return <ReportStatusBadge status={String(value ?? "")} />;
}

function renderMoneyWithCurrency(
  amount: string | null | undefined,
  currency: string | null | undefined,
) {
  if (amount === null || amount === undefined || amount === "") return "-";

  return (
    <div className="whitespace-nowrap">
      <div className="font-medium">
        {formatMoney(amount, currency ?? undefined)}
      </div>
      <div className="text-xs text-primary-gray">{currency ?? "-"}</div>
    </div>
  );
}

// PR COLUMNS
export const prColumns: ReportTableColumn<PRReportItem>[] = [
  {
    header: "PR Number",
    accessor: "pr_number",
    sortable: true,
    render: (value) => <NowrapText value={value} className="font-medium" />,
  },
  {
    header: "Title",
    accessor: "title",
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[180px]" />,
  },
  {
    header: "Requester",
    accessor: "requested_by_name",
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[150px]" />,
  },
  {
    header: "Item",
    accessor: "item_name",
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[200px]" />,
  },
  {
    header: "Qty",
    accessor: "quantity",
    sortable: true,
    align: "right",
    render: (value) => <NowrapText value={formatQuantity(value as string)} />,
  },
  {
    header: "Unit Price",
    accessor: "unit_price",
    sortable: true,
    align: "right",
    render: (value, row) => (
      <NowrapText value={formatMoney(value as string, row.currency)} />
    ),
  },
  {
    header: "Line Total",
    accessor: "line_total",
    sortable: true,
    align: "right",
    render: (value, row) => (
      <NowrapText value={formatMoney(value as string, row.currency)} />
    ),
  },

  {
    header: "Base Line Total",
    accessor: "base_line_total",
    sortable: true,
    align: "right",
    render: (value, row) =>
      renderMoneyWithCurrency(value as string | null, row.base_currency),
  },
  {
    header: "Status",
    accessor: "status",
    render: renderStatus,
  },
  {
    header: "Created",
    accessor: "created_at",
    sortable: true,
    render: renderDate,
  },
  {
    header: "Actions",
    accessor: "pr_id",
    render: (value) => (
      <ActionLink
        to={`/purchase-requisitions/${value}`}
        state={{ from: "reports", report: "purchase-requisitions" }}
      />
    ),
  },
];

// PO COLUMNS
export const poColumns: ReportTableColumn<POReportItem>[] = [
  {
    header: "PO Number",
    accessor: "po_number",
    sortable: true,
    render: (value) => <NowrapText value={value} className="font-medium" />,
  },
  {
    header: "Supplier",
    accessor: "supplier_name",
    sortable: true,
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[170px]" />,
  },
  {
    header: "Item",
    accessor: "item_name",
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[200px]" />,
  },
  {
    header: "Qty",
    accessor: "quantity",
    sortable: true,
    align: "right",
    render: (value) => <NowrapText value={formatQuantity(value as string)} />,
  },
  {
    header: "Unit Price",
    accessor: "unit_price",
    sortable: true,
    align: "right",
    render: (value, row) => (
      <NowrapText value={formatMoney(value as string, row.currency)} />
    ),
  },
  {
    header: "Line Total",
    accessor: "line_total",
    sortable: true,
    align: "right",
    render: (value, row) => (
      <NowrapText value={formatMoney(value as string, row.currency)} />
    ),
  },

  {
    header: "Base Line Total",
    accessor: "base_line_total",
    sortable: true,
    align: "right",
    render: (value, row) =>
      renderMoneyWithCurrency(value as string | null, row.base_currency),
  },
  {
    header: "Status",
    accessor: "status",
    render: renderStatus,
  },
  {
    header: "Created",
    accessor: "created_at",
    sortable: true,
    render: renderDate,
  },
  {
    header: "Actions",
    accessor: "po_id",
    render: (value) => (
      <ActionLink
        to={`/purchase-orders/${value}`}
        state={{ from: "reports", report: "purchase-orders" }}
      />
    ),
  },
];

// INVOICE COLUMNS
export const invoiceColumns: ReportTableColumn<InvoiceReportItem>[] = [
  {
    header: "Invoice No.",
    accessor: "invoice_number",
    sortable: true,
    render: (value) => <NowrapText value={value} className="font-medium" />,
  },
  {
    header: "Supplier",
    accessor: "supplier_name",
    sortable: true,
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[170px]" />,
  },
  {
    header: "PO Number",
    accessor: "po_number",
    sortable: true,
    render: (value) => <NowrapText value={value} />,
  },
  {
    header: "Item",
    accessor: "item_description",
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[220px]" />,
  },
  {
    header: "Qty",
    accessor: "quantity",
    align: "right",
    sortable: true,
    render: (value) => <NowrapText value={formatQuantity(value as string)} />,
  },
  {
    header: "Unit Price",
    accessor: "unit_price",
    align: "right",
    sortable: true,
    render: (value, row) => (
      <NowrapText
        value={formatMoney(value as string, row.currency ?? undefined)}
      />
    ),
  },
  {
    header: "Line Total",
    accessor: "line_total",
    align: "right",
    sortable: true,
    render: (value, row) => (
      <NowrapText
        value={formatMoney(value as string, row.currency ?? undefined)}
      />
    ),
  },

  {
    header: "Base Line Total",
    accessor: "base_line_total",
    sortable: true,
    align: "right",
    render: (value, row) =>
      renderMoneyWithCurrency(value as string | null, row.base_currency),
  },
  {
    header: "Status",
    accessor: "status",
    render: renderStatus,
  },
  {
    header: "Created",
    accessor: "created_at",
    sortable: true,
    render: renderDate,
  },
  {
    header: "Actions",
    accessor: "invoice_id",
    render: (value) => (
      <ActionLink
        to={`/invoices/${value}`}
        state={{ from: "reports", report: "invoices" }}
      />
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
      render: (value) => <NowrapText value={value} className="font-medium" />,
    },
    {
      header: "Supplier",
      accessor: "supplier_name",
      sortable: true,
      render: (value) => (
        <TruncatedText value={value} maxWidth="max-w-[170px]" />
      ),
    },
    {
      header: "PO Number",
      accessor: "po_number",
      sortable: true,
      render: (value) => <NowrapText value={value} />,
    },
    {
      header: "Total Amount (KES)",
      accessor: "base_total_amount",
      align: "right",
      sortable: true,
      render: (value) => <NowrapText value={formatMoney(value as string)} />,
    },
    {
      header: "Amount Paid (KES)",
      accessor: "base_amount_paid",
      align: "right",
      sortable: true,
      render: (value) => <NowrapText value={formatMoney(value as string)} />,
    },
    {
      header: "Outstanding (KES)",
      accessor: "base_outstanding_amount",
      align: "right",
      sortable: true,
      render: (value) => <NowrapText value={formatMoney(value as string)} />,
    },
    {
      header: "Status",
      accessor: "status",
      render: renderStatus,
    },
    {
      header: "Created",
      accessor: "created_at",
      sortable: true,
      render: renderDate,
    },
    {
      header: "Actions",
      accessor: "invoice_id",
      render: (value) => (
        <ActionLink
          to={`/reports/outstanding-invoices/${value}`}
          state={{ from: "reports", report: "outstanding-invoices" }}
        />
      ),
    },
  ];

// PAYMENT COLUMNS
export const paymentColumns: ReportTableColumn<PaymentReportItem>[] = [
  {
    header: "Reference",
    accessor: "payment_reference",
    sortable: true,
    render: (value) => <NowrapText value={value} className="font-medium" />,
  },
  {
    header: "Invoice No.",
    accessor: "invoice_number",
    sortable: true,
    render: (value) => <NowrapText value={value} />,
  },
  {
    header: "Supplier",
    accessor: "supplier_name",
    sortable: true,
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[170px]" />,
  },
  {
    header: "Amount",
    accessor: "amount",
    align: "right",
    sortable: true,
    render: (value, row) =>
      renderMoneyWithCurrency(value as string, row.currency),
  },
  {
    header: "Base Amount",
    accessor: "base_amount",
    align: "right",
    sortable: true,
    render: (value, row) =>
      renderMoneyWithCurrency(value as string | null, row.base_currency),
  },
  {
    header: "Method",
    accessor: "payment_method",
    render: (value) => <NowrapText value={value} />,
  },
  {
    header: "Created By",
    accessor: "created_by_name",
    render: (value) => <TruncatedText value={value} maxWidth="max-w-[150px]" />,
  },
  {
    header: "Status",
    accessor: "status",
    render: renderStatus,
  },
  {
    header: "Created",
    accessor: "created_at",
    sortable: true,
    render: renderDate,
  },
  {
    header: "Paid At",
    accessor: "paid_at",
    sortable: true,
    render: (value) => (
      <NowrapText value={value ? formatDate(value as string) : "-"} />
    ),
  },
  {
    header: "Actions",
    accessor: "payment_id",
    render: (value) => (
      <ActionLink
        to={`/payments/${value}`}
        state={{ from: "reports", report: "payments" }}
      />
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
        <TruncatedText
          value={value}
          maxWidth="max-w-[190px]"
          className="font-medium"
        />
      ),
    },
    {
      header: "Category",
      accessor: "supplier_category",
      sortable: true,
      render: (value) => (
        <span className="inline-flex max-w-[160px] items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
          <TruncatedText value={value || "Uncategorised"} maxWidth="max-w-[130px]" />
        </span>
      ),
    },
    {
      header: "Invoice Total(KES)",
      accessor: "base_total_invoice_amount",
      align: "right",
      sortable: true,
      render: (value, row) => (
        <NowrapText
          value={formatMoney(value as string, row.base_currency ?? undefined)}
        />
      ),
    },
    {
      header: "Paid Total (KES)",
      accessor: "base_total_paid_amount",
      align: "right",
      sortable: true,
      render: (value, row) => (
        <NowrapText
          value={formatMoney(value as string, row.base_currency ?? undefined)}
        />
      ),
    },
    {
      header: "Outstanding (KES)",
      accessor: "base_outstanding_amount",
      align: "right",
      sortable: true,
      render: (value, row) => (
        <NowrapText
          value={formatMoney(value as string, row.base_currency ?? undefined)}
        />
      ),
    },
    {
      header: "Invoices",
      accessor: "invoice_count",
      align: "right",
      sortable: true,
      render: (value) => <NowrapText value={value} />,
    },
    {
      header: "Payments",
      accessor: "payment_count",
      align: "right",
      sortable: true,
      render: (value) => <NowrapText value={value} />,
    },
    {
      header: "Actions",
      accessor: "supplier_id",
      render: (value) => (
        <ActionLink
          to={`/reports/supplier-spend/${value}`}
          state={{ from: "reports", report: "supplier-spend" }}
        />
      ),
    },
  ];

// SUPPLIER LEAD TIME COLUMNS
export const supplierLeadTimeColumns: ReportTableColumn<SupplierLeadTimeReportItem>[] =
  [
    {
      header: "PO Number",
      accessor: "po_number",
      sortable: true,
      render: (value) => <NowrapText value={value} className="font-medium" />,
    },
    {
      header: "Supplier",
      accessor: "supplier_name",
      sortable: true,
      render: (value) => (
        <TruncatedText value={value} maxWidth="max-w-[190px]" />
      ),
    },
    {
      header: "Invoice No.",
      accessor: "invoice_number",
      sortable: true,
      render: (value) => <NowrapText value={value} />,
    },
    {
      header: "Issued",
      accessor: "issued_at",
      sortable: true,
      render: (value) => (
        <NowrapText value={value ? formatDate(value as string) : "-"} />
      ),
    },
    {
      header: "Invoice Created",
      accessor: "invoice_created_at",
      sortable: true,
      render: (value) => (
        <NowrapText value={value ? formatDate(value as string) : "-"} />
      ),
    },
    {
      header: "Lead Time",
      accessor: "lead_time_days",
      align: "right",
      sortable: true,
      render: (value) => (
        <NowrapText
          value={
            value === null || value === undefined
              ? "-"
              : `${Number(value).toFixed(1)} days`
          }
        />
      ),
    },
    {
      header: "Actions",
      accessor: "po_id",
      render: (value) => (
        <ActionLink
          to={`/reports/supplier-lead-time/${value}`}
          state={{ from: "reports", report: "supplier-lead-time" }}
        />
      ),
    },
  ];
