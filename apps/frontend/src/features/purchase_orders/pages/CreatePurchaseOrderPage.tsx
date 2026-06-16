import axios from "axios";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import PurchaseOrderStatusBadge from "../components/PurchaseOrderStatusBadge";

import { getDepartmentOptions } from "../../Departments/api/departmentApi";
import type { Department } from "../../Departments/types/department.types";
import { getSuppliers } from "../../suppliers/api/supplierApi";
import type { Supplier } from "../../suppliers/types/supplier.types";

import { createPurchaseOrder } from "../api/purchaseOrderApi";
import {
  clearCreatePurchaseOrderDraft,
  useCreatePurchaseOrderDraft,
} from "../hooks/useCreatePurchaseOrderDraft";
import PurchaseOrderItemsForm from "../components/PurchaseOrderItemsForm";
import type { PurchaseOrderItemCreate } from "../types/purchaseOrder.types";
import SupplierPicker from "../components/SupplierPicker";

import { currencyOptions } from "../../../utils/currencyOptions";
import { userHasPermission } from "../../../utils/permissions";

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

export default function CreatePurchaseOrderPage() {
  const navigate = useNavigate();
  const canCreatePO = userHasPermission("po.create");

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

  useCreatePurchaseOrderDraft({
    supplierId,
    departmentId,
    currency,
    notes,
    items,
    setSupplierId,
    setDepartmentId,
    setCurrency,
    setNotes,
    setItems,
  });

  useEffect(() => {
    async function fetchFormOptions() {
      if (!canCreatePO) {
        setError("You do not have permission to create purchase orders.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const supplierResponse = await getSuppliers();

        setSuppliers(supplierResponse.filter((supplier) => supplier.is_active));

        const departmentResponse = await getDepartmentOptions();

        setDepartments(
          departmentResponse.filter((department) => department.is_active),
        );
      } catch (error) {
        setError(
          getApiErrorMessage(
            error,
            "Failed to load purchase order form options.",
          ),
        );
      } finally {
        setLoading(false);
      }
    }

    fetchFormOptions();
  }, [canCreatePO]);

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
        Number(item.unit_price) <= 0,
    );

    if (hasInvalidItem) {
      setError(
        "Please make sure every item has a name, quantity greater than 0, and unit price greater than 0.",
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

      clearCreatePurchaseOrderDraft();

      navigate(`/purchase-orders/${createdPO.id}`);
    } catch (error) {
      setError(getApiErrorMessage(error, "Failed to create purchase order."));
    } finally {
      setSaving(false);
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

  return (
    <PageContainer>
      <PageHeader
        title="Create Standalone Purchase Order"
        description="Create a purchase order that is not linked to a purchase requisition."
        actions={
          <div className="flex flex-wrap items-center gap-3">
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
          <Link to="/purchase-orders">
            <Button type="button" variant="secondary" disabled={saving}>
              Cancel
            </Button>
          </Link>

          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Purchase Order"}
          </Button>
        </Card>
      </form>
    </PageContainer>
  );
}
