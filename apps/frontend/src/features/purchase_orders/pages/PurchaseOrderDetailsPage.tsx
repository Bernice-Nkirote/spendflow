import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getPurchaseOrderById } from "../api/purchaseOrderApi";
import { getInvoicesByPurchaseOrder } from "../../invoices/api/invoiceApi";

import type { PurchaseOrderDetails } from "../types/purchaseOrder.types";
import PurchaseOrderActions from "../components/PurchaseOrderActions";
import { formatCurrency } from "../../../utils/formatCurrency";

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

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [purchaseOrder, setPurchaseOrder] =
    useState<PurchaseOrderDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [linkedInvoiceId, setLinkedInvoiceId] = useState<string | null>(null);
  useEffect(() => {
    async function fetchPurchaseOrder() {
      if (!id) {
        setError("Purchase order ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [purchaseOrderResponse, invoiceResponse] = await Promise.all([
          getPurchaseOrderById(id),
          getInvoicesByPurchaseOrder(id),
        ]);

        setPurchaseOrder(purchaseOrderResponse);
        setLinkedInvoiceId(invoiceResponse[0]?.id ?? null);
      } catch {
        setError("Failed to load purchase order details.");
      } finally {
        setLoading(false);
      }
    }

    fetchPurchaseOrder();
  }, [id]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!purchaseOrder) {
    return <ErrorState message="Purchase order was not found." />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-3">
            <Link
              to="/purchase-orders"
              className="text-sm font-medium text-primary-blue hover:underline"
            >
              ← Back to Purchase Orders
            </Link>

            <Link
              to="/reports"
              className="text-sm font-medium text-primary-blue hover:underline"
            >
              ← Back to Reports
            </Link>
          </div>

          <h1 className="mt-3 text-2xl font-semibold text-primary-black">
            {purchaseOrder.po_number}
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            Supplier: {purchaseOrder.supplier_name ?? "-"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {formatStatus(purchaseOrder.status)}
          </span>

          <span className="text-sm text-primary-gray">
            Created {formatDate(purchaseOrder.created_at)}
          </span>
          <PurchaseOrderActions
            purchaseOrder={purchaseOrder}
            onUpdated={(updatedPurchaseOrder) => {
              setPurchaseOrder(updatedPurchaseOrder);
              setActionError(null);
            }}
            onError={setActionError}
          />
          {["APPROVED", "SENT"].includes(purchaseOrder.status) &&
            !linkedInvoiceId && (
              <Link
                to={`/invoices/new?purchaseOrderId=${purchaseOrder.id}&from=purchase-order`}
              >
                <button className="inline-flex items-center justify-center rounded-lg bg-primary-blue px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-blue/90">
                  Create Invoice
                </button>
              </Link>
            )}
          {["APPROVED", "SENT"].includes(purchaseOrder.status) &&
            linkedInvoiceId && (
              <Link to={`/invoices/${linkedInvoiceId}`}>
                <button className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-primary-black transition hover:bg-gray-50">
                  View Invoice
                </button>
              </Link>
            )}
        </div>
      </div>
      {actionError && <ErrorState message={actionError} />}
      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Original Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(
              Number(purchaseOrder.total_amount ?? 0),
              purchaseOrder.currency,
            )}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Transaction currency: {purchaseOrder.currency}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Base Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {purchaseOrder.base_amount && purchaseOrder.base_currency
              ? formatCurrency(
                  Number(purchaseOrder.base_amount),
                  purchaseOrder.base_currency,
                )
              : "-"}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Used for approval thresholds
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Exchange Rate</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatRate(purchaseOrder.exchange_rate)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            {purchaseOrder.currency}
            {purchaseOrder.base_currency
              ? ` → ${purchaseOrder.base_currency}`
              : ""}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Supplier</p>
          <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
            {purchaseOrder.supplier_name ?? "-"}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Rate date: {formatDate(purchaseOrder.exchange_rate_date)}
          </p>
        </div>

        <div
          className={`rounded-xl border p-4 shadow-sm ${
            purchaseOrder.signed_pdf_file_path
              ? "border-green-200 bg-green-50"
              : "border-yellow-200 bg-yellow-50"
          }`}
        >
          <p
            className={`text-sm font-medium ${
              purchaseOrder.signed_pdf_file_path
                ? "text-green-700"
                : "text-yellow-700"
            }`}
          >
            Signed PDF
          </p>

          <p
            className={`mt-2 text-lg font-semibold ${
              purchaseOrder.signed_pdf_file_path
                ? "text-green-800"
                : "text-yellow-800"
            }`}
          >
            {purchaseOrder.signed_pdf_file_path
              ? "Uploaded"
              : "Required before dispatch"}
          </p>

          <p className="mt-1 text-xs text-primary-gray">
            {purchaseOrder.signed_pdf_original_filename ??
              "Download the PO, sign it, then upload the signed PDF."}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Purchase Order Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              PO Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.po_number}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              PR Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.pr_number ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Department
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.department_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.created_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Submitted By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.submitted_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Issued By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.issued_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Status
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatStatus(purchaseOrder.status)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Submitted At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseOrder.submitted_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Issued At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseOrder.issued_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseOrder.created_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Updated At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseOrder.updated_at)}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Notes
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.notes || "-"}
            </p>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-xl border bg-white shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Purchase Order Items
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Item-level details attached to this purchase order.
          </p>
        </div>

        <div className="max-w-full overflow-x-auto">
          <table className="min-w-[800px] border-separate border-spacing-0 text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Item
                </th>
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
              {purchaseOrder.items.map((item) => (
                <tr
                  key={item.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="border-b px-4 py-3 text-gray-700">
                    {item.item_name}
                  </td>
                  <td className="border-b px-4 py-3 text-gray-700">
                    {item.description || "-"}
                  </td>
                  <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {item.quantity}
                  </td>
                  <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(
                      Number(item.unit_price ?? 0),
                      purchaseOrder.currency,
                    )}
                  </td>
                  <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(
                      Number(item.total_price ?? 0),
                      purchaseOrder.currency,
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
