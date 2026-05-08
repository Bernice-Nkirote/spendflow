import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";

import LoadingState from "../../../components/ui/LoadingState";

import { getSuppliers } from "../../suppliers/api/supplierApi";
import type { Supplier } from "../../suppliers/types/supplier.types";

import { getDepartments } from "../../Departments/api/departmentApi";
import type { Department } from "../../Departments/types/department.types";

import { createPurchaseOrder } from "../api/purchaseOrderApi";
import PurchaseOrderItemsForm from "../components/PurchaseOrderItemsForm";
import type { PurchaseOrderItemCreate } from "../types/purchaseOrder.types";

import { currencyOptions } from "../../../utils/currencyOptions";

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<PurchaseOrderItemCreate[]>([
    {
      item_name: "",
      description: "",
      quantity: "1",
      unit_price: "0",
    },
  ]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFormOptions() {
      try {
        setLoading(true);
        setError(null);

        const [supplierResponse, departmentResponse] = await Promise.all([
          getSuppliers(),
          getDepartments(),
        ]);

        setSuppliers(supplierResponse.filter((supplier) => supplier.is_active));
        setDepartments(
          departmentResponse.filter((department) => department.is_active),
        );
      } catch {
        setError("Failed to load purchase order form options.");
      } finally {
        setLoading(false);
      }
    }

    fetchFormOptions();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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

      const createdPO = await createPurchaseOrder({
        supplier_id: supplierId,
        department_id: departmentId || null,
        currency,
        notes: notes.trim() || null,
        items: cleanedItems,
      });

      navigate(`/purchase-orders/${createdPO.id}`);
    } catch {
      setError("Failed to create purchase order.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <Link
          to="/purchase-orders"
          className="text-sm font-medium text-primary-blue hover:underline"
        >
          ← Back to Purchase Orders
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-primary-black">
          Create Standalone Purchase Order
        </h1>

        <p className="mt-1 text-sm text-primary-gray">
          Create a purchase order that is not linked to a purchase requisition.
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
          <label className="mb-1 block text-sm font-medium text-primary-black">
            Department
          </label>
          <select
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
          >
            <option value="">No department selected</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-primary-black">
            Currency
          </label>
          <select
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
            required
          >
            {currencyOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-primary-black">
            Notes
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

      <PurchaseOrderItemsForm items={items} onChange={setItems} />

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link to="/purchase-orders">
          <Button type="button" variant="secondary">
            Cancel
          </Button>
        </Link>

        <Button type="submit" disabled={saving}>
          {saving ? "Creating..." : "Create Purchase Order"}
        </Button>
      </div>
    </form>
  );
}
