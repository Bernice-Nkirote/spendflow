import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import { formatCurrency } from "../../../utils/formatCurrency";
import {
  createSupplierInvoice,
  getSupplierPurchaseOrder,
} from "../api/supplierPortalApi";

type SupplierPurchaseOrderItem = {
  id: string;
  item_name: string;
  description?: string | null;
  quantity: string;
  unit_price: string;
  total_price: string;
};

type SupplierPurchaseOrder = {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name?: string | null;
  status: string;
  total_amount: string;
  currency: string;
  items: SupplierPurchaseOrderItem[];
};

type SupplierInvoiceLineItemCreate = {
  purchase_order_item_id: string;
  description: string;
  invoiced_quantity: string;
  unit_price: string;
};

export default function SupplierCreateInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [purchaseOrder, setPurchaseOrder] =
    useState<SupplierPurchaseOrder | null>(null);
  const [lineItems, setLineItems] = useState<SupplierInvoiceLineItemCreate[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalAmount = useMemo(() => {
    return lineItems.reduce((total, item) => {
      return (
        total +
        Number(item.invoiced_quantity || 0) * Number(item.unit_price || 0)
      );
    }, 0);
  }, [lineItems]);

  useEffect(() => {
    async function fetchPurchaseOrder() {
      if (!id) {
        setError("Purchase order is required to create an invoice.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getSupplierPurchaseOrder(id);

        if (!["APPROVED", "SENT"].includes(response.status)) {
          setError(
            "Invoices can only be created from approved or sent purchase orders.",
          );
          return;
        }

        setPurchaseOrder(response);

        setLineItems(
          response.items.map((item: SupplierPurchaseOrderItem) => ({
            purchase_order_item_id: item.id,
            description: item.description || item.item_name,
            invoiced_quantity: item.quantity,
            unit_price: item.unit_price,
          })),
        );
      } catch {
        setError("Failed to load purchase order for invoice creation.");
      } finally {
        setLoading(false);
      }
    }

    fetchPurchaseOrder();
  }, [id]);

  function updateLineItem(
    index: number,
    field: keyof SupplierInvoiceLineItemCreate,
    value: string,
  ) {
    const updatedItems = [...lineItems];

    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setLineItems(updatedItems);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!purchaseOrder) {
      setError("Purchase order details are missing.");
      return;
    }

    if (lineItems.length === 0) {
      setError("At least one invoice line item is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const createdInvoice = await createSupplierInvoice({
        purchase_order_id: purchaseOrder.id,
        supplier_id: purchaseOrder.supplier_id,
        line_items: lineItems,
      });

      navigate(`/supplier-portal/invoices/${createdInvoice.id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setError(
          error.response?.data?.detail ??
            "Failed to create invoice. Please try again.",
        );
      } else {
        setError("Failed to create invoice. Please try again.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState />;

  if (error && !purchaseOrder) {
    return <ErrorState message={error} />;
  }

  if (!purchaseOrder) {
    return <ErrorState message="Purchase order was not found." />;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6 p-4 sm:p-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <Link
          to={`/supplier-portal/purchase-orders/${purchaseOrder.id}`}
          className="text-sm font-medium text-primary-blue hover:underline"
        >
          ← Back to Purchase Order
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-primary-black">
          Create Invoice
        </h1>

        <p className="mt-1 text-sm text-primary-gray">
          Create an invoice from purchase order {purchaseOrder.po_number}. The
          invoice number will be generated automatically.
        </p>
      </div>

      {error && <ErrorState message={error} />}

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Purchase Order</p>
          <p className="mt-2 text-lg font-semibold text-primary-black">
            {purchaseOrder.po_number}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Supplier</p>
          <p className="mt-2 text-lg font-semibold text-primary-black">
            {purchaseOrder.supplier_name ?? "-"}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Invoice Total</p>
          <p className="mt-2 text-lg font-semibold text-primary-black">
            {formatCurrency(totalAmount, purchaseOrder.currency)}
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Line Items
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Confirm the quantities and unit prices being invoiced.
          </p>

          <div className="mt-4 flex flex-col gap-4">
            {lineItems.map((item, index) => {
              const poItem = purchaseOrder.items.find(
                (purchaseOrderItem) =>
                  purchaseOrderItem.id === item.purchase_order_item_id,
              );

              const lineTotal =
                Number(item.invoiced_quantity || 0) *
                Number(item.unit_price || 0);

              return (
                <div
                  key={item.purchase_order_item_id}
                  className="grid gap-3 rounded-xl border bg-gray-50 p-4 md:grid-cols-2 xl:grid-cols-5"
                >
                  <div>
                    <p className="text-sm font-medium text-primary-black">
                      {poItem?.item_name ?? "Item"}
                    </p>
                    <p className="mt-1 text-xs text-primary-gray">
                      Ordered quantity: {poItem?.quantity ?? "-"}
                    </p>
                  </div>

                  <Input
                    label="Description"
                    value={item.description}
                    onChange={(event) =>
                      updateLineItem(index, "description", event.target.value)
                    }
                    required
                  />

                  <Input
                    label="Invoice Quantity"
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.invoiced_quantity}
                    onChange={(event) =>
                      updateLineItem(
                        index,
                        "invoiced_quantity",
                        event.target.value,
                      )
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
                      updateLineItem(index, "unit_price", event.target.value)
                    }
                    required
                  />

                  <div>
                    <p className="text-sm font-medium text-primary-black">
                      Line Total
                    </p>
                    <p className="mt-2 text-sm text-primary-gray">
                      {formatCurrency(lineTotal, purchaseOrder.currency)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link to={`/supplier-portal/purchase-orders/${purchaseOrder.id}`}>
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>

          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
