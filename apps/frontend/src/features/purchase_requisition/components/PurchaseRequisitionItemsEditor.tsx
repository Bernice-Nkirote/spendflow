import { useState } from "react";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";

import {
  createPurchaseRequisitionItem,
  deletePurchaseRequisitionItem,
  updatePurchaseRequisitionItem,
} from "../api/purchaseRequisitionApi";

import type {
  PurchaseRequisitionDetails,
  PurchaseRequisitionItem,
  PurchaseRequisitionItemCreate,
} from "../types/purchaseRequisition.types";

type Props = {
  purchaseRequisition: PurchaseRequisitionDetails;
  onItemsUpdated: () => void;
};

const EMPTY_ITEM: PurchaseRequisitionItemCreate = {
  item_name: "",
  description: "",
  quantity: "1",
  unit_price: "",
};

function normalizeUnitPrice(value: string) {
  return value === "" ? "0" : value;
}

export default function PurchaseRequisitionItemsEditor({
  purchaseRequisition,
  onItemsUpdated,
}: Props) {
  const [newItem, setNewItem] = useState<PurchaseRequisitionItemCreate>({
    ...EMPTY_ITEM,
  });

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] =
    useState<PurchaseRequisitionItemCreate | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing(item: PurchaseRequisitionItem) {
    setEditingItemId(item.id);
    setEditingItem({
      item_name: item.item_name,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price ?? "",
    });
    setError(null);
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditingItem(null);
  }

  async function handleAddItem() {
    if (!newItem.item_name.trim()) {
      setError("Item name is required.");
      return;
    }

    if (!newItem.description.trim()) {
      setError("Item description is required.");
      return;
    }

    if (Number(newItem.quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await createPurchaseRequisitionItem(purchaseRequisition.id, {
        item_name: newItem.item_name.trim(),
        description: newItem.description.trim(),
        quantity: newItem.quantity,
        unit_price: normalizeUnitPrice(newItem.unit_price),
      });

      setNewItem({ ...EMPTY_ITEM });
      onItemsUpdated();
    } catch {
      setError("Failed to add item.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateItem(itemId: string) {
    if (!editingItem) return;

    try {
      setLoading(true);
      setError(null);

      await updatePurchaseRequisitionItem(purchaseRequisition.id, itemId, {
        ...editingItem,
        unit_price: normalizeUnitPrice(editingItem.unit_price),
      });

      cancelEditing();
      onItemsUpdated();
    } catch {
      setError("Failed to update item.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteItem(itemId: string) {
    try {
      setLoading(true);
      setError(null);

      await deletePurchaseRequisitionItem(purchaseRequisition.id, itemId);

      onItemsUpdated();
    } catch {
      setError("Failed to delete item.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-primary-black">
        Edit Requested Items
      </h2>

      <p className="mt-1 text-sm text-primary-gray">
        Add, update, or remove items while this PR is still in draft.
      </p>

      {error && (
        <div className="mt-4">
          <ErrorState message={error} />
        </div>
      )}

      <div className="mt-5 space-y-4">
        {purchaseRequisition.items.map((item) => {
          const isEditing = editingItemId === item.id;

          return (
            <div key={item.id} className="rounded-xl border bg-gray-50 p-4">
              {isEditing && editingItem ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={editingItem.item_name}
                    onChange={(event) =>
                      setEditingItem({
                        ...editingItem,
                        item_name: event.target.value,
                      })
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                    placeholder="Item name"
                  />

                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={editingItem.quantity}
                    onChange={(event) =>
                      setEditingItem({
                        ...editingItem,
                        quantity: event.target.value,
                      })
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                    placeholder="Quantity"
                  />

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editingItem.unit_price}
                    onChange={(event) =>
                      setEditingItem({
                        ...editingItem,
                        unit_price: event.target.value,
                      })
                    }
                    className="rounded-lg border px-3 py-2 text-sm"
                    placeholder="Unit price"
                  />

                  <textarea
                    value={editingItem.description}
                    onChange={(event) =>
                      setEditingItem({
                        ...editingItem,
                        description: event.target.value,
                      })
                    }
                    className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
                    placeholder="Description"
                  />

                  <div className="flex gap-2 md:col-span-2">
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => handleUpdateItem(item.id)}
                    >
                      Save Item
                    </Button>

                    <Button
                      type="button"
                      disabled={loading}
                      onClick={cancelEditing}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="font-medium text-primary-black">
                      {item.item_name}
                    </p>
                    <p className="text-sm text-primary-gray">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      disabled={loading}
                      onClick={() => startEditing(item)}
                    >
                      Edit
                    </Button>

                    <Button
                      type="button"
                      disabled={
                        loading || purchaseRequisition.items.length <= 1
                      }
                      onClick={() => handleDeleteItem(item.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border bg-gray-50 p-4">
        <h3 className="font-medium text-primary-black">Add New Item</h3>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <input
            value={newItem.item_name}
            onChange={(event) =>
              setNewItem({ ...newItem, item_name: event.target.value })
            }
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Item name"
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={newItem.quantity}
            onChange={(event) =>
              setNewItem({ ...newItem, quantity: event.target.value })
            }
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Quantity"
          />

          <input
            type="number"
            min="0"
            step="0.01"
            value={newItem.unit_price}
            onChange={(event) =>
              setNewItem({ ...newItem, unit_price: event.target.value })
            }
            className="rounded-lg border px-3 py-2 text-sm"
            placeholder="Unit price"
          />

          <textarea
            value={newItem.description}
            onChange={(event) =>
              setNewItem({ ...newItem, description: event.target.value })
            }
            className="rounded-lg border px-3 py-2 text-sm md:col-span-2"
            placeholder="Description"
          />
        </div>

        <div className="mt-4">
          <Button type="button" disabled={loading} onClick={handleAddItem}>
            Add Item
          </Button>
        </div>
      </div>
    </section>
  );
}
