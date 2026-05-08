import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getPaymentById } from "../api/paymentApi";
import type { PaymentDetails } from "../types/payment.types";

function formatCurrency(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(Number.isNaN(numericValue) ? 0 : numericValue);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatLabel(value: string | null | undefined) {
  if (!value) return "-";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayment() {
      if (!id) {
        setError("Payment ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getPaymentById(id);
        setPayment(response);
      } catch {
        setError("Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    }

    fetchPayment();
  }, [id]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!payment) {
    return <ErrorState message="Payment was not found." />;
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
            {payment.reference ?? payment.id}
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            Invoice: {payment.invoice_number ?? "-"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {formatLabel(payment.status)}
          </span>

          <span className="text-sm text-primary-gray">
            Paid {formatDate(payment.paid_at)}
          </span>
        </div>
      </div>

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(payment.amount)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Method</p>
          <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
            {formatLabel(payment.payment_method)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Supplier</p>
          <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
            {payment.supplier_name ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Invoice</p>
          <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
            {payment.invoice_number ?? "-"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Payment Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Reference
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.reference ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Invoice Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.invoice_number ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.created_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Payment Method
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatLabel(payment.payment_method)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Status
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatLabel(payment.status)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Paid At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(payment.paid_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(payment.created_at)}
            </p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Related Invoice
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Invoice Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.invoice_number ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.supplier_name ?? "-"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
