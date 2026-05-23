import { useState } from "react";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Input from "../../../components/ui/Input";

import type { PurchaseOrderItemCreate } from "../types/purchaseOrder.types";

type Props = {
  items: PurchaseOrderItemCreate[];
  onChange: (items: PurchaseOrderItemCreate[]) => void;
};

function calculateLineTotal(quantity: string, unitPrice: string) {
  const numericQuantity = Number(quantity || 0);
  const numericUnitPrice = Number(unitPrice || 0);

  if (Number.isNaN(numericQuantity) || Number.isNaN(numericUnitPrice)) {
    return "0.00";
  }

  return (numericQuantity * numericUnitPrice).toFixed(2);
}

export default function PurchaseOrderItemsForm({ items, onChange }: Props) {
  const [addItemError, setAddItemError] = useState("");

  function isItemComplete(item: PurchaseOrderItemCreate) {
    return (
      item.item_name.trim().length > 0 &&
      Number(item.quantity) > 0 &&
      Number(item.unit_price) > 0
    );
  }
  function updateItem(
    index: number,
    field: keyof PurchaseOrderItemCreate,
    value: string,
  ) {
    const updatedItems = [...items];
    setAddItemError("");
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    onChange(updatedItems);
  }

  function addItem() {
    const lastItem = items[items.length - 1];

    if (lastItem && !isItemComplete(lastItem)) {
      setAddItemError(
        "Complete the current item before adding another one. Quantity and unit price must be greater than zero.",
      );
      return;
    }

    setAddItemError("");

    onChange([
      ...items,
      {
        item_name: "",
        description: "",
        quantity: "1",
        unit_price: "0",
      },
    ]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Purchase Order Items
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Add the goods or services included in this purchase order.
          </p>
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <Button type="button" onClick={addItem}>
            Add Item
          </Button>

          {addItemError && (
            <div className="max-w-md rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm">
              {addItemError}
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
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(event) =>
                  updateItem(index, "quantity", event.target.value)
                }
              />

              <Input
                required
                label="Unit Price"
                type="number"
                min="0.01"
                step="0.01"
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
                  value={item.description ?? ""}
                  onChange={(event) =>
                    updateItem(index, "description", event.target.value)
                  }
                  className="min-h-20 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                  placeholder="Optional item description"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
