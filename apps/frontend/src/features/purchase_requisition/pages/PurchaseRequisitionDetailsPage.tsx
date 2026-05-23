import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Button from "../../../components/ui/Button";
import BackButton from "../../../components/ui/BackButton";
import Card from "../../../components/ui/Card";
import PageContainer from "../../../components/ui/PageContainer";
import TableWrapper from "../../../components/ui/TableWrapper";
import PageHeader from "../../../components/ui/PageHeader";

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
import { userHasPermission } from "../../../utils/permissions";

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
  const canUpdatePR = userHasPermission("pr.update");
  const canConvertPRToPO = userHasPermission("pr.convert_to_po");

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
    <PageContainer>
      {returnTo ? (
        <BackButton label="Back to Approval" to={returnTo} />
      ) : (
        <BackButton
          fallbackLabel="Back to Purchase Requisitions"
          fallbackTo="/purchase-requisitions"
        />
      )}

      <PageHeader
        title={`Purchase Requisition ${purchaseRequisition.pr_number}`}
        description={purchaseRequisition.title}
        actions={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <PurchaseRequisitionStatusBadge
              status={purchaseRequisition.status}
            />

            {canUpdatePR && purchaseRequisition.status === "DRAFT" && (
              <Link
                to={`/purchase-requisitions/${purchaseRequisition.id}/edit`}
              >
                <Button type="button" variant="secondary">
                  Edit PR
                </Button>
              </Link>
            )}

            {canConvertPRToPO && purchaseRequisition.status === "APPROVED" && (
              <Link
                to={`/purchase-orders/from-requisition/${purchaseRequisition.id}`}
                state={{
                  from: "purchase-orders",
                  label: "Back to Purchase Orders",
                }}
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
        }
      />
      {actionError && <ErrorState message={actionError} />}
      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-primary-gray">Original Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(
              Number(purchaseRequisition.total_amount ?? 0),
              normalizeCurrencyCode(purchaseRequisition.currency),
            )}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Transaction currency:{" "}
            {normalizeCurrencyCode(purchaseRequisition.currency)}
          </p>
        </Card>

        <Card className="p-4 shadow-md">
          <p className="text-sm text-primary-gray">Base Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {purchaseRequisition.base_amount &&
            purchaseRequisition.base_currency
              ? formatCurrency(
                  Number(purchaseRequisition.base_amount),
                  normalizeCurrencyCode(purchaseRequisition.base_currency),
                )
              : "-"}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Used for approval thresholds
          </p>
        </Card>

        <Card className="p-4 shadow-md">
          <p className="text-sm text-primary-gray">Exchange Rate</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatRate(purchaseRequisition.exchange_rate)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            {purchaseRequisition.currency}
            {purchaseRequisition.base_currency
              ? ` → ${purchaseRequisition.base_currency}`
              : ""}
          </p>
        </Card>

        <Card className="p-4 shadow-md">
          <p className="text-sm text-primary-gray">Items</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {purchaseRequisition.items.length}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Rate date: {formatDate(purchaseRequisition.exchange_rate_date)}
          </p>
        </Card>
      </section>
      <PurchaseRequisitionApprovalCard
        purchaseRequisition={purchaseRequisition}
      />

      <Card>
        <h2 className="text-lg font-semibold text-primary-black">
          Requisition Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
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
      </Card>
      <Card>
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
          <div className="mt-4">
            <TableWrapper minWidth="900px">
              <table className="w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                      Description
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                      Quantity
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                      Unit Price
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
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
                          className="block max-w-[360px] whitespace-pre-wrap break-words leading-6"
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
            </TableWrapper>
          </div>
        )}
      </Card>
      {canUpdatePR && purchaseRequisition.status === "DRAFT" && (
        <PurchaseRequisitionItemsEditor
          purchaseRequisition={purchaseRequisition}
          onItemsUpdated={fetchPurchaseRequisition}
        />
      )}
    </PageContainer>
  );
}
