import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getOutstandingInvoiceDetail } from "../api/outStandingInvoiceApi";
import type { OutstandingInvoiceDetail } from "../types/outStandingInvoice.type";
import { formatCurrency } from "../../../utils/formatCurrency";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoneyValue(
  value: string | number | null | undefined,
  currency: string | null | undefined,
) {
  if (value === null || value === undefined || value === "") return "-";

  return formatCurrency(Number(value), currency ?? "KES");
}

export default function OutstandingInvoiceDetailsPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const [invoice, setInvoice] = useState<OutstandingInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOutstandingInvoice() {
      if (!invoiceId) {
        setError("Invoice ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getOutstandingInvoiceDetail(invoiceId);
        setInvoice(response);
      } catch {
        setError("Failed to load outstanding invoice details.");
      } finally {
        setLoading(false);
      }
    }

    fetchOutstandingInvoice();
  }, [invoiceId]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!invoice) {
    return <ErrorState message="Outstanding invoice was not found." />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            to="/reports"
            className="text-sm font-medium text-primary-blue hover:underline"
          >
            ← Back to Reports
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-primary-black">
            Outstanding Invoice {invoice.invoice_number}
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            Supplier: {invoice.supplier_name ?? "-"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <span className="inline-flex w-fit rounded-full bg-yellow-50 px-3 py-1 text-sm font-medium text-yellow-700 ring-1 ring-yellow-600/20">
            {formatStatus(invoice.status)}
          </span>

          <span className="text-sm text-primary-gray">
            Created {formatDate(invoice.created_at)}
          </span>
        </div>
      </div>
      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Original Invoice Total</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatMoneyValue(invoice.total_amount, invoice.currency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Transaction currency: {invoice.currency ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Original Amount Paid</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatMoneyValue(invoice.amount_paid, invoice.currency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Paid in invoice currency
          </p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-yellow-700">
            Original Outstanding Balance
          </p>
          <p className="mt-2 text-3xl font-bold text-yellow-800">
            {formatMoneyValue(invoice.outstanding_amount, invoice.currency)}
          </p>
          <p className="mt-1 text-xs text-yellow-700">
            Invoice-currency balance
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Base Invoice Total</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatMoneyValue(invoice.base_total_amount, invoice.base_currency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Base currency: {invoice.base_currency ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Base Amount Paid</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatMoneyValue(invoice.base_amount_paid, invoice.base_currency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Paid value in base currency
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-primary-blue">
            Base Outstanding Balance
          </p>
          <p className="mt-2 text-3xl font-bold text-primary-blue">
            {formatMoneyValue(
              invoice.base_outstanding_amount,
              invoice.base_currency,
            )}
          </p>
          <p className="mt-1 text-xs text-primary-blue">
            Company base-currency balance
          </p>
        </div>
      </section>
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Outstanding Invoice Information
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
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {invoice.supplier_name ?? "-"}
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
              Status
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatStatus(invoice.status)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(invoice.created_at)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
