import axios from "axios";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import TableWrapper from "../../../components/ui/TableWrapper";

import { getPurchaseRequisitionById } from "../../purchase_requisition/api/purchaseRequisitionApi";
import PurchaseRequisitionStatusBadge from "../../purchase_requisition/components/PurchaseRequisitionStatusBadge";
import type { PurchaseRequisitionDetails } from "../../purchase_requisition/types/purchaseRequisition.types";
import { getSuppliers } from "../../suppliers/api/supplierApi";
import type { Supplier } from "../../suppliers/types/supplier.types";

import { createPurchaseOrderFromRequisition } from "../api/purchaseOrderApi";
import PurchaseOrderStatusBadge from "../components/PurchaseOrderStatusBadge";

import { formatCurrency } from "../../../utils/formatCurrency";
import { userHasPermission } from "../../../utils/permissions";

function formatQuantity(value: string | number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue)) return "0";

  return numericValue.toLocaleString("en-KE", {
    maximumFractionDigits: 2,
  });
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

export default function CreatePurchaseOrderFromPRPage() {
  const { requisitionId } = useParams<{ requisitionId: string }>();
  const navigate = useNavigate();
  const canCreatePO = userHasPermission("po.create");

  const [purchaseRequisition, setPurchaseRequisition] =
    useState<PurchaseRequisitionDetails | null>(null);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPageData() {
      if (!canCreatePO) {
        setError("You do not have permission to create purchase orders.");
        setLoading(false);
        return;
      }

      if (!requisitionId) {
        setError("Purchase requisition ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [prResponse, supplierResponse] = await Promise.all([
          getPurchaseRequisitionById(requisitionId),
          getSuppliers(),
        ]);

        if (prResponse.status !== "APPROVED") {
          setError(
            "Only approved purchase requisitions can be converted to purchase orders.",
          );
          return;
        }

        setPurchaseRequisition(prResponse);
        setSuppliers(supplierResponse.filter((supplier) => supplier.is_active));
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Failed to load purchase requisition conversion page.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, [requisitionId, canCreatePO]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!requisitionId || !purchaseRequisition) {
      setError("Purchase requisition data is missing.");
      return;
    }

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const createdPO = await createPurchaseOrderFromRequisition(
        requisitionId,
        {
          supplier_id: supplierId,
          department_id: purchaseRequisition.department_id,
          currency: purchaseRequisition.currency,
          notes: notes.trim() || null,
          items: purchaseRequisition.items.map((item) => ({
            item_name: item.item_name,
            description: item.description || null,
            quantity: item.quantity,
            unit_price: item.unit_price || "0",
          })),
        },
      );

      navigate(`/purchase-orders/${createdPO.id}`);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Failed to create purchase order from requisition.",
        );
      } else {
        setError("Failed to create purchase order from requisition.");
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingState />;

  if (!canCreatePO) {
    return (
      <PageContainer>
        <BackButton
          fallbackLabel="Back to Purchase Orders"
          fallbackTo="/purchase-orders"
        />
        <ErrorState message="You do not have permission to create purchase orders." />
      </PageContainer>
    );
  }

  if (error && !purchaseRequisition) {
    return <ErrorState message={error} />;
  }

  if (!purchaseRequisition) {
    return <ErrorState message="Purchase requisition was not found." />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={`Create PO from PR ${purchaseRequisition.pr_number}`}
        description="Convert this approved purchase requisition into a draft purchase order."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PurchaseRequisitionStatusBadge
              status={purchaseRequisition.status}
            />
            <PurchaseOrderStatusBadge status="DRAFT" />
            <BackButton
              fallbackLabel="Back to Purchase Orders"
              fallbackTo="/purchase-orders"
            />
          </div>
        }
      />

      {error && <ErrorState message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-primary-black">
            Purchase Order Information
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-black">
                Supplier
              </label>
              <select
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                required
              >
                <option value="">Select supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
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
                Currency
              </p>
              <p className="mt-1 text-sm text-primary-black">
                {purchaseRequisition.currency}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
                Total Amount
              </p>
              <p className="mt-1 text-sm font-medium text-primary-black">
                {formatCurrency(
                  Number(purchaseRequisition.total_amount ?? 0),
                  purchaseRequisition.currency,
                )}
              </p>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-primary-black">
                PO Notes
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                placeholder="Optional notes for this purchase order"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-black">
                Items copied from PR
              </h2>
              <p className="mt-1 text-sm text-primary-gray">
                These items will be copied into the purchase order.
              </p>
            </div>

            <p className="text-sm text-primary-gray">
              {purchaseRequisition.items.length} items
            </p>
          </div>

          <div className="mt-4">
            <TableWrapper minWidth="850px">
              <table className="w-full divide-y divide-gray-200 bg-white text-sm">
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
                        {formatCurrency(
                          Number(item.unit_price ?? 0),
                          purchaseRequisition.currency,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>
          </div>
        </Card>

        <Card className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link to="/purchase-orders">
            <Button type="button" variant="secondary" disabled={creating}>
              Cancel
            </Button>
          </Link>

          <Button type="submit" disabled={creating}>
            {creating ? "Creating..." : "Create Purchase Order"}
          </Button>
        </Card>
      </form>
    </PageContainer>
  );
}
