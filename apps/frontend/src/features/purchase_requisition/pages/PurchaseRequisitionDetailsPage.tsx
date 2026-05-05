import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getPurchaseRequisitionById } from "../api/purchaseRequisitionApi";

import type { PurchaseRequisitionDetails } from "../types/PurchaseRequisition.types";

function formatCurrency(
  value: string | number | null | undefined,
  currency = "KES",
) {
  const numericValue = Number(value ?? 0);

  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
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

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PurchaseRequisitionDetailsPage() {
  const { id } = useParams<{ id: string }>();

  const [requisition, setRequisition] =
    useState<PurchaseRequisitionDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRequisition() {
      if (!id) {
        setError("Purchase requisition ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getPurchaseRequisitionById(id);
        setRequisition(response);
      } catch {
        setError("Failed to load purchase requisition details.");
      } finally {
        setLoading(false);
      }
    }

    fetchRequisition();
  }, [id]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!requisition) {
    return <ErrorState message="Purchase requisition was not found." />;
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
            {requisition.pr_number}
          </h1>

          <p className="mt-1 text-sm text-primary-gray">{requisition.title}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <span className="inline-flex w-fit rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
            {formatStatus(requisition.status)}
          </span>

          <span className="text-sm text-primary-gray">
            Created {formatDate(requisition.created_at)}
          </span>
        </div>
      </div>

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Total Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(requisition.total_amount, requisition.currency)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Currency</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {requisition.currency}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Items</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {requisition.items.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Active</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {requisition.is_active ? "Yes" : "No"}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Requisition Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Title
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {requisition.title}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              PR Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {requisition.pr_number}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Department Name
            </p>
            <p className="mt-1 break-all text-sm text-primary-black">
              {requisition.department_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Requested By
            </p>
            <p className="mt-1 break-all text-sm text-primary-black">
              {requisition.requested_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(requisition.created_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Updated At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(requisition.updated_at)}
            </p>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Description
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {requisition.description || "-"}
            </p>
          </div>
        </div>
      </section>

      <section className="min-w-0 rounded-xl border bg-white shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Requisition Items
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Item-level details attached to this purchase requisition.
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
                  Line Total
                </th>
              </tr>
            </thead>

            <tbody>
              {requisition.items.map((item) => (
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
                    {formatCurrency(item.unit_price, requisition.currency)}
                  </td>
                  <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(item.line_total, requisition.currency)}
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
