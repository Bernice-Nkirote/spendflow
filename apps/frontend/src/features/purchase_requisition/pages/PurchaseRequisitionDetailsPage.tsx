import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Button from "../../../components/ui/Button";

import { getPurchaseRequisitionById } from "../api/purchaseRequisitionApi";
import PurchaseRequisitionStatusBadge from "../components/PurchaseRequisitionStatusBadge";
import PurchaseRequisitionItemsEditor from "../components/PurchaseRequisitionItemsEditor";
import PurchaseRequisitionActions from "../components/PurchaseRequisitionActions";
import PurchaseRequisitionApprovalCard from "../components/PurchaseRequisitionApprovalCard";
import type { PurchaseRequisitionDetails } from "../types/purchaseRequisition.types";
import {
  formatCurrency,
  normalizeCurrencyCode,
} from "../../../utils/formatCurrency";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatQuantity(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue)) return "0";

  return numericValue.toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
}

export default function PurchaseRequisitionDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();

  const returnTo = searchParams.get("returnTo");

  const [purchaseRequisition, setPurchaseRequisition] =
    useState<PurchaseRequisitionDetails | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function fetchPurchaseRequisition() {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getPurchaseRequisitionById(id);

      setPurchaseRequisition(response);
    } catch {
      setError("Failed to load purchase requisition.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPurchaseRequisition();
  }, [id]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!purchaseRequisition) {
    return <ErrorState message="Purchase requisition was not found." />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap gap-3">
            <Link
              to="/purchase-requisitions"
              className="text-sm font-medium text-primary-blue hover:underline"
            >
              ← Back to Purchase Requisitions
            </Link>

            {returnTo && (
              <Link
                to={returnTo}
                className="text-sm font-medium text-primary-blue hover:underline"
              >
                ← Back to Approval
              </Link>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-semibold text-primary-black">
            Purchase Requisition {purchaseRequisition.pr_number}
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            {purchaseRequisition.title}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:flex-col lg:items-end">
          <PurchaseRequisitionStatusBadge status={purchaseRequisition.status} />

          <span className="text-sm text-primary-gray">
            Created {formatDate(purchaseRequisition.created_at)}
          </span>

          {purchaseRequisition.status === "DRAFT" && (
            <Link
              to={`/purchase-requisitions/${purchaseRequisition.id}/edit`}
              className="text-sm font-medium text-primary-blue hover:underline"
            >
              Edit PR
            </Link>
          )}
          {purchaseRequisition.status === "APPROVED" && (
            <Link
              to={`/purchase-orders/from-requisition/${purchaseRequisition.id}`}
            >
              <Button type="button" variant="secondary">
                Create PO from PR
              </Button>
            </Link>
          )}
          <PurchaseRequisitionActions
            purchaseRequisition={purchaseRequisition}
            onUpdated={(updatedPurchaseRequisition) => {
              setPurchaseRequisition(updatedPurchaseRequisition);
              setActionError(null);
            }}
            onError={setActionError}
          />
        </div>
      </div>
      {actionError && <ErrorState message={actionError} />}
      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Total Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(
              Number(purchaseRequisition.total_amount ?? 0),
              normalizeCurrencyCode(purchaseRequisition.currency),
            )}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Items</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {purchaseRequisition.items.length}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Currency</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {normalizeCurrencyCode(purchaseRequisition.currency)}
          </p>
        </div>
      </section>
      <PurchaseRequisitionApprovalCard
        purchaseRequisition={purchaseRequisition}
      />

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Requisition Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              PR Number
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseRequisition.pr_number}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Status
            </p>
            <div className="mt-1">
              <PurchaseRequisitionStatusBadge
                status={purchaseRequisition.status}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Department
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseRequisition.department_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Requested By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseRequisition.requested_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseRequisition.created_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Updated At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(purchaseRequisition.updated_at)}
            </p>
          </div>
        </div>

        {purchaseRequisition.description && (
          <div className="mt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Description
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-primary-black">
              {purchaseRequisition.description}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-primary-black">
            Requested Items
          </h2>

          <p className="text-sm text-primary-gray">
            {purchaseRequisition.items.length} items
          </p>
        </div>
        {purchaseRequisition.items.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No items found"
              message="This purchase requisition has no requested items."
            />
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-[900px] divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Item
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-primary-gray">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-primary-gray">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-primary-gray">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-primary-gray">
                    Line Total
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {purchaseRequisition.items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-primary-black">
                      <span
                        className="block max-w-[260px] whitespace-pre-wrap break-words"
                        title={item.item_name}
                      >
                        {item.item_name}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-primary-black">
                      <span
                        className="block max-w-[360px] whitespace-pre-wrap break-words leadin-6"
                        title={item.description}
                      >
                        {item.description || "-"}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {formatQuantity(item.quantity)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                      {item.unit_price
                        ? formatCurrency(
                            Number(item.unit_price ?? 0),
                            purchaseRequisition.currency,
                          )
                        : "-"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-primary-black">
                      {item.line_total
                        ? formatCurrency(
                            Number(item.line_total ?? 0),
                            purchaseRequisition.currency,
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {purchaseRequisition.status === "DRAFT" && (
        <PurchaseRequisitionItemsEditor
          purchaseRequisition={purchaseRequisition}
          onItemsUpdated={fetchPurchaseRequisition}
        />
      )}
    </div>
  );
}
