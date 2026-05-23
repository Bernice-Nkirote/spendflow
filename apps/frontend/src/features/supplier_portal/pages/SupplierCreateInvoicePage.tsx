import axios from "axios";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { formatCurrency } from "../../../utils/formatCurrency";
import {
  createSupplierInvoice,
  getSupplierPurchaseOrder,
} from "../api/supplierPortalApi";
import type {
  SupplierInvoiceLineItemCreate,
  SupplierPurchaseOrder,
} from "../types/supplierPortal.types";

export default function SupplierCreateInvoicePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { alert, showAlert, clearAlert } = useFloatingAlert();

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
          response.items.map((item) => ({
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
    setLineItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!purchaseOrder) {
      showAlert("error", "Purchase order details are missing.");
      return;
    }

    if (lineItems.length === 0) {
      showAlert("error", "At least one invoice line item is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      clearAlert();

      const createdInvoice = await createSupplierInvoice({
        purchase_order_id: purchaseOrder.id,
        supplier_id: purchaseOrder.supplier_id ?? "",
        line_items: lineItems,
      });

      showAlert("success", "Invoice created successfully.");

      navigate(`/supplier-portal/invoices/${createdInvoice.id}`);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        showAlert(
          "error",
          err.response?.data?.detail ??
            "Failed to create invoice. Please try again.",
        );
        return;
      }

      showAlert("error", "Failed to create invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading purchase order..." />;

  if (error && !purchaseOrder) {
    return <ErrorState message={error} />;
  }

  if (!purchaseOrder) {
    return (
      <EmptyState
        title="Purchase order not found"
        message="This purchase order could not be found or is no longer available."
      />
    );
  }

  return (
    <div className="space-y-6">
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <div>
        <BackButton
          fallbackLabel="Back to Purchase Order"
          fallbackTo={`/supplier-portal/purchase-orders/${purchaseOrder.id}`}
        />

        <h1 className="mt-4 text-2xl font-bold text-primary-black">
          Create Invoice
        </h1>

        <p className="mt-1 text-sm text-primary-gray">
          Create an invoice from purchase order {purchaseOrder.po_number}. The
          invoice number will be generated automatically.
        </p>
      </div>

      {error && <ErrorState message={error} />}

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-primary-gray">Purchase Order</p>
          <p className="mt-2 text-lg font-semibold text-primary-black">
            {purchaseOrder.po_number}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Supplier</p>
          <p className="mt-2 text-lg font-semibold text-primary-black">
            {purchaseOrder.supplier_name ?? "-"}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Invoice Total</p>
          <p className="mt-2 text-lg font-semibold text-primary-black">
            {formatCurrency(totalAmount, purchaseOrder.currency)}
          </p>
        </Card>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-primary-black">
              Invoice Line Items
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Confirm the quantities and unit prices being invoiced.
            </p>
          </div>

          <div className="flex flex-col gap-4">
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
                    <p
                      className="truncate text-sm font-medium text-primary-black"
                      title={poItem?.item_name ?? "Item"}
                    >
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
        </Card>

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
