import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getSupplierSpendDetail } from "../api/supplierSpendApi";
import type { SupplierSpendDetail } from "../types/supplierSpendDetail.types";

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

function formatStatus(status: string | null | undefined) {
  if (!status) return "-";

  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SupplierSpendDetailsPage() {
  const { supplierId } = useParams<{ supplierId: string }>();

  const [supplierSpend, setSupplierSpend] =
    useState<SupplierSpendDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSupplierSpendDetail() {
      if (!supplierId) {
        setError("Supplier ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getSupplierSpendDetail(supplierId);
        setSupplierSpend(response);
      } catch {
        setError("Failed to load supplier spend details.");
      } finally {
        setLoading(false);
      }
    }

    fetchSupplierSpendDetail();
  }, [supplierId]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!supplierSpend) {
    return <ErrorState message="Supplier spend details were not found." />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            to="/reports?report=supplier-spend"
            className="text-sm font-medium text-primary-blue hover:underline"
          >
            ← Back to Supplier Spend Report
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-primary-black">
            Supplier Spend Details
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            Supplier: {supplierSpend.supplier_name}
          </p>
        </div>

        <div className="flex flex-col gap-1 text-sm text-primary-gray lg:items-end">
          <span>{supplierSpend.invoice_count} invoices</span>
          <span>{supplierSpend.payment_count} payments</span>
        </div>
      </div>

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Invoice Total</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(supplierSpend.total_invoice_amount)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Paid Total</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(supplierSpend.total_paid_amount)}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-yellow-700">Outstanding</p>
          <p className="mt-2 text-2xl font-bold text-yellow-800">
            {formatCurrency(supplierSpend.outstanding_amount)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Activity Count</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {supplierSpend.invoice_count + supplierSpend.payment_count}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Supplier Financial Summary
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Supplier Name
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {supplierSpend.supplier_name}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Supplier ID
            </p>
            <p className="mt-1 break-all text-sm text-primary-black">
              {supplierSpend.supplier_id}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Invoice Count
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {supplierSpend.invoice_count}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Payment Count
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {supplierSpend.payment_count}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Breakdown
          </h2>

          <p className="text-sm text-primary-gray">
            {supplierSpend.invoices.length} invoices
          </p>
        </div>

        {supplierSpend.invoices.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No invoices found"
              message="This supplier has no invoice history for this report."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Invoice No.
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    PO Number
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-primary-gray">
                    Total
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-primary-gray">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-primary-gray">
                    Outstanding
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {supplierSpend.invoices.map((invoice) => (
                  <tr key={invoice.invoice_id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                      {invoice.invoice_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {invoice.po_number ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatCurrency(invoice.amount_paid)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-primary-black">
                      {formatCurrency(invoice.outstanding_amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {formatStatus(invoice.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {formatDate(invoice.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        to={`/invoices/${invoice.invoice_id}`}
                        className="text-sm font-medium text-primary-blue hover:underline"
                      >
                        View Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-primary-black">
            Payment Breakdown
          </h2>

          <p className="text-sm text-primary-gray">
            {supplierSpend.payments.length} payments
          </p>
        </div>

        {supplierSpend.payments.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No payments found"
              message="This supplier has no payment history for this report."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Invoice No.
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-primary-gray">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Method
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Paid At
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Created
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {supplierSpend.payments.map((payment) => (
                  <tr key={payment.payment_id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                      {payment.payment_reference ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {payment.invoice_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {payment.payment_method ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {formatStatus(payment.status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {formatDate(payment.paid_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {formatDate(payment.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link
                        to={`/payments/${payment.payment_id}`}
                        className="text-sm font-medium text-primary-blue hover:underline"
                      >
                        View Payment
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
