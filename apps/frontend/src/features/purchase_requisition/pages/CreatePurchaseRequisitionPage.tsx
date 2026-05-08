import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";

import { createPurchaseRequisition } from "../api/purchaseRequisitionApi";
import { getDepartmentOptions } from "../../reports/api/reportOptionsApi";
import type { PurchaseRequisitionItemCreate } from "../types/purchaseRequisition.types";
import type { ReportFilterOption } from "../../reports/types/report.types";

import { currencyOptions } from "../../../utils/currencyOptions";

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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [departmentId, setDepartmentId] = useState("");
  const [departmentOptions, setDepartmentOptions] = useState<
    ReportFilterOption[]
  >([]);

  const [items, setItems] = useState<PurchaseRequisitionItemCreate[]>([
    DEFAULT_ITEM,
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDepartments() {
      try {
        const departments = await getDepartmentOptions();
        setDepartmentOptions(departments);
      } catch {
        setDepartmentOptions([]);
      }
    }

    loadDepartments();
  }, []);

  function updateItem(
    index: number,
    field: keyof PurchaseRequisitionItemCreate,
    value: string,
  ) {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  function addItem() {
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

      navigate("/purchase-requisitions");
    } catch {
      setError("Failed to create purchase requisition.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <Link
          to="/purchase-requisitions"
          className="text-sm font-medium text-primary-blue hover:underline"
        >
          ← Back to Purchase Requisitions
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-primary-black">
          Create Purchase Requisition
        </h1>

        <p className="mt-1 text-sm text-primary-gray">
          Create a draft purchase requisition with requested items.
        </p>
      </div>

      {error && <ErrorState message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Requisition Information
          </h2>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-primary-black">
                Title
              </label>
              <input
                required
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                placeholder="e.g. Office supplies request"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-primary-black">
                Currency
              </label>
              <select
                required
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
              >
                {currencyOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-primary-black">
                Department
              </label>

              <select
                required
                value={departmentId}
                onChange={(event) => setDepartmentId(event.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
              >
                <option value="">Select department</option>

                {departmentOptions.map((department) => (
                  <option key={department.value} value={department.value}>
                    {department.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-primary-black">
                Description
              </label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                placeholder="Optional notes about this request"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-primary-black">
                Requested Items
              </h2>
              <p className="text-sm text-primary-gray">
                Add at least one item to the requisition.
              </p>
            </div>

            <Button type="button" onClick={addItem}>
              Add Item
            </Button>
          </div>

          <div className="mt-4 flex flex-col gap-4">
            {items.map((item, index) => (
              <div
                key={index}
                className="rounded-xl border bg-gray-50 p-4 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="font-medium text-primary-black">
                    Item {index + 1}
                  </h3>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="text-sm font-medium text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium text-primary-black">
                      Item Name
                    </label>
                    <input
                      required
                      value={item.item_name}
                      onChange={(event) =>
                        updateItem(index, "item_name", event.target.value)
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-primary-black">
                      Quantity
                    </label>
                    <input
                      required
                      min="0.01"
                      step="0.01"
                      type="number"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, "quantity", event.target.value)
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-primary-black">
                      Unit Price
                    </label>
                    <input
                      min="0"
                      step="0.01"
                      type="number"
                      value={item.unit_price}
                      onChange={(event) =>
                        updateItem(index, "unit_price", event.target.value)
                      }
                      className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-primary-black">
                      Line Total
                    </label>
                    <input
                      disabled
                      value={calculateLineTotal(item.quantity, item.unit_price)}
                      className="mt-1 w-full rounded-lg border bg-gray-100 px-3 py-2 text-sm text-primary-gray"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-primary-black">
                      Description
                    </label>
                    <textarea
                      required
                      value={item.description}
                      onChange={(event) =>
                        updateItem(index, "description", event.target.value)
                      }
                      className="mt-1 min-h-20 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:justify-end">
          <Link to="/purchase-requisitions">
            <Button type="button" disabled={submitting}>
              Cancel
            </Button>
          </Link>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Draft PR"}
          </Button>
        </div>
      </form>
    </div>
  );
}
