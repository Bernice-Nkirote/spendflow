import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import Input from "../../../components/ui/Input";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";

import { createPurchaseRequisition } from "../api/purchaseRequisitionApi";
import {
  clearCreatePurchaseRequisitionDraft,
  useCreatePurchaseRequisitionDraft,
} from "../hooks/useCreatePurchaseRequisitionDraft";
import { getDepartmentOptions } from "../../reports/api/reportOptionsApi";
import PurchaseRequisitionStatusBadge from "../components/PurchaseRequisitionStatusBadge";

import type { PurchaseRequisitionItemCreate } from "../types/purchaseRequisition.types";
import type { ReportFilterOption } from "../../reports/types/report.types";

import { currencyOptions } from "../../../utils/currencyOptions";
import { userHasPermission } from "../../../utils/permissions";

const DEFAULT_ITEM: PurchaseRequisitionItemCreate = {
  item_name: "",
  description: "",
  quantity: "1",
  unit_price: "",
};

function calculateLineTotal(quantity: string, unitPrice: string) {
  const numericQuantity = Number(quantity || 0);
  const numericUnitPrice = Number(unitPrice || 0);

  if (Number.isNaN(numericQuantity) || Number.isNaN(numericUnitPrice)) {
    return "0.00";
  }

  return (numericQuantity * numericUnitPrice).toFixed(2);
}

export default function CreatePurchaseRequisitionPage() {
  const navigate = useNavigate();
  const canCreatePR = userHasPermission("pr.create");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [departmentId, setDepartmentId] = useState("");
  const [departmentOptions, setDepartmentOptions] = useState<
    ReportFilterOption[]
  >([]);

  const [items, setItems] = useState<PurchaseRequisitionItemCreate[]>([
    { ...DEFAULT_ITEM },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);

  useCreatePurchaseRequisitionDraft({
    title,
    description,
    currency,
    departmentId,
    items,
    setTitle,
    setDescription,
    setCurrency,
    setDepartmentId,
    setItems,
  });

  useEffect(() => {
    async function loadDepartments() {
      if (!canCreatePR) {
        setError("You do not have permission to create purchase requisitions.");
        return;
      }

      try {
        const departments = await getDepartmentOptions();
        setDepartmentOptions(departments);
      } catch {
        setDepartmentOptions([]);
      }
    }

    loadDepartments();
  }, [canCreatePR]);

  function updateItem(
    index: number,
    field: keyof PurchaseRequisitionItemCreate,
    value: string,
  ) {
    setItemError(null);
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function isItemReadyForNextRow(item: PurchaseRequisitionItemCreate) {
    return (
      item.item_name.trim().length > 0 &&
      item.description.trim().length > 0 &&
      Number(item.quantity) > 0
    );
  }

  function addItem() {
    const lastItem = items[items.length - 1];

    if (lastItem && !isItemReadyForNextRow(lastItem)) {
      setItemError(
        "Complete the current item before adding another one. Item name, description, and quantity are required.",
      );
      return;
    }

    setItemError(null);
    setItems((prev) => [...prev, { ...DEFAULT_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!departmentId) {
      setError("Please select a department.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await createPurchaseRequisition({
        title,
        description: description || undefined,
        currency,
        department_id: departmentId,
        items: items.map((item) => ({
          item_name: item.item_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price || "0",
        })),
      });

      clearCreatePurchaseRequisitionDraft();

      navigate("/purchase-requisitions");
    } catch {
      setError("Failed to create purchase requisition.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!canCreatePR) {
    return (
      <PageContainer>
        <BackButton
          fallbackLabel="Back to Purchase Requisitions"
          fallbackTo="/purchase-requisitions"
        />
        <ErrorState message="You do not have permission to create purchase requisitions." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Create Purchase Requisition"
        description="Create a draft purchase requisition with requested items."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <PurchaseRequisitionStatusBadge status="DRAFT" />
            <BackButton
              fallbackLabel="Back to Purchase Requisitions"
              fallbackTo="/purchase-requisitions"
            />
          </div>
        }
      />

      {error && <ErrorState message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-primary-black">
            Requisition Information
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              required
              label="Title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Office supplies request"
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-black">
                Currency
              </label>
              <select
                required
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              >
                {currencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-black">
                Department
              </label>
              <select
                required
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              >
                <option value="">Select department</option>
                {departmentOptions.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-primary-black">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="min-h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                placeholder="Optional notes about this request"
              />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-black">
                Requested Items
              </h2>
              <p className="mt-1 text-sm text-primary-gray">
                Add at least one item to the requisition.
              </p>
            </div>

            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Button type="button" onClick={addItem}>
                Add Item
              </Button>

              {itemError && (
                <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm">
                  {itemError}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-medium text-primary-black">
                    Item {index + 1}
                  </h3>

                  {items.length > 1 && (
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Input
                    required
                    label="Item Name"
                    value={item.item_name}
                    onChange={(event) =>
                      updateItem(index, "item_name", event.target.value)
                    }
                  />

                  <Input
                    required
                    label="Quantity"
                    min="0.01"
                    step="0.01"
                    type="number"
                    value={item.quantity}
                    onChange={(event) =>
                      updateItem(index, "quantity", event.target.value)
                    }
                  />

                  <Input
                    label="Unit Price"
                    min="0"
                    step="0.01"
                    type="number"
                    value={item.unit_price}
                    onChange={(event) =>
                      updateItem(index, "unit_price", event.target.value)
                    }
                  />

                  <Input
                    label="Line Total"
                    disabled
                    value={calculateLineTotal(item.quantity, item.unit_price)}
                    className="bg-gray-100 text-primary-gray"
                  />

                  <div className="space-y-1 md:col-span-2">
                    <label className="block text-sm font-medium text-primary-black">
                      Description
                    </label>
                    <textarea
                      required
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, "description", event.target.value)
                      }
                      className="min-h-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link to="/purchase-requisitions">
            <Button type="button" variant="secondary" disabled={submitting}>
              Cancel
            </Button>
          </Link>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Draft PR"}
          </Button>
        </Card>
      </form>
    </PageContainer>
  );
}
