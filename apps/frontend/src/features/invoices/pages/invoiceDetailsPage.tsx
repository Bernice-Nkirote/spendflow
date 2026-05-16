import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import FloatingAlert from "../../../components/ui/FloatingAlert";

import { formatCurrency } from "../../../utils/formatCurrency";
import { getInvoiceById } from "../api/invoiceApi";
import { getPaymentsByInvoice } from "../../payments/api/paymentApi";
import type { InvoiceDetails } from "../types/invoice.types";
import InvoiceActions from "../components/InvoiceActions";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRate(value: string | number | null | undefined) {
  if (!value) return "-";

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) return "-";

  return numericValue.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

export default function InvoiceDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [hasPendingPayment, setHasPendingPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      if (!id) {
        setError("Invoice ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getInvoiceById(id);
        setInvoice(response);

        const payments = await getPaymentsByInvoice(id);
        setHasPendingPayment(
          payments.some((payment) => payment.status === "PENDING_APPROVAL"),
        );
      } catch {
        setError("Failed to load invoice details.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [id]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!invoice) {
    return <ErrorState message="Invoice was not found." />;
  }

  const submittedBy =
    invoice.submitted_by_user_name ??
    invoice.submitted_by_supplier_user_name ??
    "-";

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {actionSuccess && (
        <FloatingAlert
          type="success"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}

      {actionError && (
        <FloatingAlert
          type="error"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            to="/invoices"
            className="text-sm font-medium text-primary-blue hover:underline"
          >
            ← Back to Invoices
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-primary-black">
            {invoice.invoice_number}
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            Supplier: {invoice.supplier_name ?? "-"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <InvoiceStatusBadge status={invoice.status} />

          <span className="text-sm text-primary-gray">
            Created {formatDate(invoice.created_at)}
          </span>

          <InvoiceActions
            invoice={invoice}
            hasPendingPayment={hasPendingPayment}
            onUpdated={(updatedInvoice) => {
              setInvoice(updatedInvoice);
              setActionError(null);
              setActionSuccess("Invoice action completed successfully.");
            }}
            onError={(message) => {
              setActionSuccess(null);
              setActionError(message);
            }}
          />
        </div>
      </div>

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Original Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(
              Number(invoice.total_amount ?? 0),
              invoice.currency ?? "KES",
            )}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Transaction currency: {invoice.currency ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Base Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {invoice.base_amount && invoice.base_currency
              ? formatCurrency(
                  Number(invoice.base_amount),
                  invoice.base_currency,
                )
              : "-"}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Used for approvals and reporting
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Exchange Rate</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatRate(invoice.exchange_rate)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            {invoice.currency}
            {invoice.base_currency ? ` → ${invoice.base_currency}` : ""}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Supplier</p>
          <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
            {invoice.supplier_name ?? "-"}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Rate date: {formatDate(invoice.exchange_rate_date)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Status</p>
          <div className="mt-3">
            <InvoiceStatusBadge status={invoice.status} />
          </div>
          <p className="mt-2 text-xs text-primary-gray">
            Invoice lifecycle status
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Invoice Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Invoice Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.invoice_number}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              PO Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.po_number ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Submitted By
            </p>
            <p className="mt-1 text-sm text-primary-black">{submittedBy}</p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Status
            </p>

            <div className="mt-2">
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(invoice.created_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Updated At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(invoice.updated_at)}
            </p>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-xl border bg-white shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Line Items
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Line-level billing details attached to this invoice.
          </p>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[800px] border-separate border-spacing-0 text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Description
                </th>
                <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Quantity
                </th>
                <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Unit Price
                </th>
                <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {invoice.line_items.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="border-b px-4 py-3 text-gray-700">
                    {item.description}
                  </td>
                  <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {item.invoiced_quantity}
                  </td>
                  <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(
                      Number(item.unit_price ?? 0),
                      invoice.currency ?? "KES",
                    )}
                  </td>
                  <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(
                      Number(item.total_price ?? 0),
                      invoice.currency ?? "KES",
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
