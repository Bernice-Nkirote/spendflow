import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getSuppliers } from "../../suppliers/api/supplierApi";
import type { Supplier } from "../../suppliers/types/supplier.types";
import { getPurchaseRequisitionById } from "../../purchase_requisition/api/purchaseRequisitionApi";
import type { PurchaseRequisitionDetails } from "../../purchase_requisition/types/purchaseRequisition.types";

import { createPurchaseOrderFromRequisition } from "../api/purchaseOrderApi";

export default function CreatePurchaseOrderFromPRPage() {
  const { requisitionId } = useParams<{ requisitionId: string }>();
  const navigate = useNavigate();

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
      } catch {
        setError("Failed to load purchase requisition conversion page.");
      } finally {
        setLoading(false);
      }
    }

    loadPageData();
  }, [requisitionId]);

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
    } catch {
      setError("Failed to create purchase order from requisition.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) return <LoadingState />;

  if (error && !purchaseRequisition) {
    return <ErrorState message={error} />;
  }

  if (!purchaseRequisition) {
    return <ErrorState message="Purchase requisition was not found." />;
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <Link
          to={`/purchase-requisitions/${purchaseRequisition.id}`}
          className="text-sm font-medium text-primary-blue hover:underline"
        >
          ← Back to Purchase Requisition
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-primary-black">
          Create PO from PR {purchaseRequisition.pr_number}
        </h1>

        <p className="mt-1 text-sm text-primary-gray">
          Convert this approved purchase requisition into a purchase order.
        </p>
      </div>

      {error && <ErrorState message={error} />}

      <section className="grid gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-primary-black">
            Supplier
          </label>
          <select
            value={supplierId}
            onChange={(event) => setSupplierId(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
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
          <p className="text-sm font-medium text-primary-black">Department</p>
          <p className="mt-2 text-sm text-primary-gray">
            {purchaseRequisition.department_name ?? "-"}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-primary-black">Currency</p>
          <p className="mt-2 text-sm text-primary-gray">
            {purchaseRequisition.currency}
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-primary-black">Total Amount</p>
          <p className="mt-2 text-sm text-primary-gray">
            {purchaseRequisition.total_amount}
          </p>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-primary-black">
            PO Notes
          </label>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
            placeholder="Optional notes for this purchase order"
          />
        </div>
      </section>

      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Items copied from PR
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[800px] text-sm">
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
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {purchaseRequisition.items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-primary-black">
                    {item.item_name}
                  </td>
                  <td className="px-4 py-3 text-primary-black">
                    {item.description || "-"}
                  </td>
                  <td className="px-4 py-3 text-right text-primary-black">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right text-primary-black">
                    {item.unit_price ?? "0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link to={`/purchase-requisitions/${purchaseRequisition.id}`}>
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>

        <Button type="submit" disabled={creating}>
          {creating ? "Creating..." : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  );
}
