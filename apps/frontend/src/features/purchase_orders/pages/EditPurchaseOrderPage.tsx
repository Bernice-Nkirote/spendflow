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

import { getDepartmentOptions } from "../../Departments/api/departmentApi";
import type { Department } from "../../Departments/types/department.types";
import { getSuppliers } from "../../suppliers/api/supplierApi";
import type { Supplier } from "../../suppliers/types/supplier.types";

import { currencyOptions } from "../../../utils/currencyOptions";

import {
  getPurchaseOrderById,
  updatePurchaseOrder,
} from "../api/purchaseOrderApi";
import PurchaseOrderItemsForm from "../components/PurchaseOrderItemsForm";
import PurchaseOrderStatusBadge from "../components/PurchaseOrderStatusBadge";
import SupplierPicker from "../components/SupplierPicker";

import type {
  PurchaseOrderItemCreate,
  PurchaseOrderStatus,
} from "../types/purchaseOrder.types";

export default function EditPurchaseOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [supplierId, setSupplierId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseOrderItemCreate[]>([]);
  const [status, setStatus] = useState<PurchaseOrderStatus | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEditData() {
      if (!id) {
        setError("Purchase order ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [purchaseOrder, supplierResponse, departmentResponse] =
          await Promise.all([
            getPurchaseOrderById(id),
            getSuppliers(),
            getDepartmentOptions(),
          ]);

        setStatus(purchaseOrder.status);

        if (purchaseOrder.status !== "DRAFT") {
          setError("Only draft purchase orders can be edited.");
          return;
        }

        setSupplierId(purchaseOrder.supplier_id);
        setDepartmentId(purchaseOrder.department_id ?? "");
        setCurrency(purchaseOrder.currency);
        setNotes(purchaseOrder.notes ?? "");
        setItems(
          purchaseOrder.items.map((item) => ({
            item_name: item.item_name,
            description: item.description ?? "",
            quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        );

        setSuppliers(supplierResponse.filter((supplier) => supplier.is_active));
        setDepartments(
          departmentResponse.filter((department) => department.is_active),
        );
      } catch {
        setError("Failed to load purchase order for editing.");
      } finally {
        setLoading(false);
      }
    }

    loadEditData();
  }, [id]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!id) {
      setError("Purchase order ID is missing.");
      return;
    }

    if (!supplierId) {
      setError("Please select a supplier.");
      return;
    }

    const cleanedItems = items.map((item) => ({
      item_name: item.item_name.trim(),
      description: item.description?.trim() || null,
      quantity: item.quantity || "0",
      unit_price: item.unit_price || "0",
    }));

    const hasInvalidItem = cleanedItems.some(
      (item) =>
        !item.item_name ||
        Number(item.quantity) <= 0 ||
        Number(item.unit_price) < 0,
    );

    if (hasInvalidItem) {
      setError(
        "Please make sure every item has a name, quantity greater than 0, and unit price of 0 or more.",
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await updatePurchaseOrder(id, {
        supplier_id: supplierId,
        department_id: departmentId || null,
        currency,
        notes: notes.trim() || null,
        items: cleanedItems,
      });

      navigate(`/purchase-orders/${id}`);
    } catch {
      setError("Failed to update purchase order.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <PageContainer>
      <PageHeader
        title="Edit Purchase Order"
        description="Update draft purchase order details before submitting for approval."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {status && <PurchaseOrderStatusBadge status={status} />}
            <BackButton
              fallbackLabel="Back to Purchase Order"
              fallbackTo={id ? `/purchase-orders/${id}` : "/purchase-orders"}
            />
          </div>
        }
      />

      {error && <ErrorState message={error} />}

      {!error && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-primary-black">
              Purchase Order Information
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="block text-sm font-medium text-primary-black">
                  Supplier
                </label>
                <SupplierPicker
                  suppliers={suppliers}
                  value={supplierId}
                  onChange={setSupplierId}
                  suggestedItemNames={items.map((item) => item.item_name)}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary-black">
                  Department
                </label>
                <select
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                >
                  <option value="">No department selected</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary-black">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                  required
                >
                  {currencyOptions.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-primary-black">
                  Notes
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

          <PurchaseOrderItemsForm items={items} onChange={setItems} />

          <Card className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link to={id ? `/purchase-orders/${id}` : "/purchase-orders"}>
              <Button type="button" variant="secondary" disabled={saving}>
                Cancel
              </Button>
            </Link>

            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Card>
        </form>
      )}
    </PageContainer>
  );
}
