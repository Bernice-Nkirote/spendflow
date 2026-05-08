import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import type { PurchaseOrderItemCreate } from "../types/purchaseOrder.types";

type Props = {
  items: PurchaseOrderItemCreate[];
  onChange: (items: PurchaseOrderItemCreate[]) => void;
};

export default function PurchaseOrderItemsForm({ items, onChange }: Props) {
  function updateItem(
    index: number,
    field: keyof PurchaseOrderItemCreate,
    value: string,
  ) {
    const updatedItems = [...items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };
    onChange(updatedItems);
  }

  function addItem() {
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
    <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Purchase Order Items
          </h2>
          <p className="text-sm text-primary-gray">
            Add the goods or services included in this purchase order.
          </p>
        </div>

        <Button type="button" variant="secondary" onClick={addItem}>
          Add Item
        </Button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid gap-3 rounded-xl border bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <Input
              label="Item Name"
              value={item.item_name}
              onChange={(event) =>
                updateItem(index, "item_name", event.target.value)
              }
              required
            />

            <Input
              label="Description"
              value={item.description ?? ""}
              onChange={(event) =>
                updateItem(index, "description", event.target.value)
              }
            />

            <Input
              label="Quantity"
              type="number"
              min="0"
              step="0.01"
              value={item.quantity}
              onChange={(event) =>
                updateItem(index, "quantity", event.target.value)
              }
              required
            />

            <Input
              label="Unit Price"
              type="number"
              min="0"
              step="0.01"
              value={item.unit_price}
              onChange={(event) =>
                updateItem(index, "unit_price", event.target.value)
              }
              required
            />

            <div className="flex items-end">
              <Button
                type="button"
                variant="danger"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
