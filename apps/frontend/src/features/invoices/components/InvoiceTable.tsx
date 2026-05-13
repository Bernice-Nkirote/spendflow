import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import { formatCurrency } from "../../../utils/formatCurrency";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import type { InvoiceListItem } from "../types/invoice.types";

type InvoiceTableProps = {
  invoices: InvoiceListItem[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getSubmittedBy(invoice: InvoiceListItem) {
  return (
    invoice.submitted_by_user_name ??
    invoice.submitted_by_supplier_user_name ??
    "-"
  );
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  return (
    <div className="max-w-full overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="min-w-[1000px] border-separate border-spacing-0 text-sm">
        <thead className="bg-gray-50">
          <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
            <th className="border-b px-4 py-3">Invoice Number</th>
            <th className="border-b px-4 py-3">Supplier</th>
            <th className="border-b px-4 py-3">PO Number</th>
            <th className="border-b px-4 py-3">Submitted By</th>
            <th className="border-b px-4 py-3 text-right">Total Amount</th>
            <th className="border-b px-4 py-3">Status</th>
            <th className="border-b px-4 py-3">Created</th>
            <th className="border-b px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="transition-colors hover:bg-gray-50">
              <td className="border-b px-4 py-3 font-medium text-primary-black">
                {invoice.invoice_number}
              </td>

              <td className="border-b px-4 py-3 text-primary-gray">
                {invoice.supplier_name ?? "Unknown supplier"}
              </td>

              <td className="border-b px-4 py-3 text-primary-gray">
                {invoice.po_number ?? "-"}
              </td>

              <td className="border-b px-4 py-3 text-primary-gray">
                {getSubmittedBy(invoice)}
              </td>

              <td className="border-b px-4 py-3 text-right tabular-nums text-primary-black">
                {formatCurrency(Number(invoice.total_amount ?? 0), undefined)}
              </td>

              <td className="border-b px-4 py-3">
                <InvoiceStatusBadge status={invoice.status} />
              </td>

              <td className="border-b px-4 py-3 text-primary-gray">
                {formatDate(invoice.created_at)}
              </td>

              <td className="border-b px-4 py-3 text-right">
                <Link to={`/invoices/${invoice.id}`}>
                  <Button variant="secondary">View</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
