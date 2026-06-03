import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";

import { formatCurrency } from "../../../utils/formatCurrency";
import { userHasPermission } from "../../../utils/permissions";

import { getPurchaseOrderById } from "../../purchase_orders/api/purchaseOrderApi";
import type { PurchaseOrderDetails } from "../../purchase_orders/types/purchaseOrder.types";
import { createInvoice } from "../api/invoiceApi";
import {
  clearCreateInvoiceDraft,
  useCreateInvoiceDraft,
} from "../hooks/useCreateInvoiceDraft";
import InvoiceStatusBadge from "../components/InvoiceStatusBadge";
import type { InvoiceLineItemCreate } from "../types/invoice.types";

export default function CreateInvoicePage() {
  const [searchParams] = useSearchParams();
  const purchaseOrderId = searchParams.get("purchaseOrderId");
  const from = searchParams.get("from");
  const navigate = useNavigate();
  const canCreateInvoice = userHasPermission("invoice.create");

  const [purchaseOrder, setPurchaseOrder] =
    useState<PurchaseOrderDetails | null>(null);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [lineItems, setLineItems] = useState<InvoiceLineItemCreate[]>([]);
  const [confirmExternalPoReceived, setConfirmExternalPoReceived] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { alert, showAlert, clearAlert } = useFloatingAlert();
  useCreateInvoiceDraft({
    purchaseOrderId,
    isReady: Boolean(purchaseOrder),
    invoiceNumber,
    lineItems,
    setInvoiceNumber,
    setLineItems,
  });

  const totalAmount = useMemo(() => {
    return lineItems.reduce((total, item) => {
      const quantity = Number(item.invoiced_quantity || 0);
      const unitPrice = Number(item.unit_price || 0);

      return total + quantity * unitPrice;
    }, 0);
  }, [lineItems]);

  useEffect(() => {
    if (!canCreateInvoice) {
      setError("You do not have permission to create invoices.");
      setLoading(false);
      return;
    }
    async function fetchPurchaseOrder() {
      if (!purchaseOrderId) {
        setError("Purchase order is required to create an invoice.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await getPurchaseOrderById(purchaseOrderId);

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
  }, [purchaseOrderId, canCreateInvoice]);

  function updateLineItem(
    index: number,
    field: keyof InvoiceLineItemCreate,
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
      showAlert("error", "Purchase order details are missing.");
      return;
    }

    if (purchaseOrder.status === "APPROVED" && !confirmExternalPoReceived) {
      showAlert(
        "error",
        "Please confirm that the supplier received this purchase order outside Tendaflow.",
      );
      return;
    }

    if (lineItems.length === 0) {
      showAlert("error", "At least one invoice line item is required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const createdInvoice = await createInvoice({
        purchase_order_id: purchaseOrder.id,
        supplier_id: purchaseOrder.supplier_id,
        invoice_number: invoiceNumber.trim() || null,
        line_items: lineItems,
      });

      clearCreateInvoiceDraft(purchaseOrder.id);

      navigate(`/invoices/${createdInvoice.id}`);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? (error.response?.data?.detail ??
          "Failed to create invoice. Please try again.")
        : "Failed to create invoice. Please try again.";

      showAlert("error", message);
      setError(null);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState message="Loading purchase order details..." />;
  }

  if (!canCreateInvoice) {
    return (
      <PageContainer>
        <BackButton fallbackLabel="Back to Invoices" fallbackTo="/invoices" />
        <ErrorState message="You do not have permission to create invoices." />
      </PageContainer>
    );
  }

  if (error && !purchaseOrder) {
    return <ErrorState message={error} />;
  }

  if (!purchaseOrder) {
    return <ErrorState message="Purchase order was not found." />;
  }

  return (
    <PageContainer>
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <PageHeader
        title="Create Invoice"
        description={`Create an invoice from purchase order ${purchaseOrder.po_number}.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="shrink-0">
              <InvoiceStatusBadge status="DRAFT" />
            </div>

            <BackButton
              fallbackLabel={
                from === "invoices"
                  ? "Back to Invoices"
                  : "Back to Purchase Order"
              }
              fallbackTo={
                from === "invoices"
                  ? "/invoices"
                  : `/purchase-orders/${purchaseOrder.id}`
              }
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-600">Purchase Order</p>
          <p className="mt-2 text-lg font-semibold text-primary-black">
            {purchaseOrder.po_number}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">Supplier</p>
          <p className="mt-2 truncate text-lg font-semibold text-primary-black">
            {purchaseOrder.supplier_name ?? "-"}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-600">Invoice Total</p>
          <p className="mt-2 text-lg font-semibold text-primary-black">
            {formatCurrency(totalAmount, purchaseOrder.currency)}
          </p>
        </Card>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {purchaseOrder.status === "APPROVED" && (
          <Card>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-amber-800">
                Purchase Order Not Marked as Sent
              </p>

              <p className="mt-2 text-sm text-amber-700">
                This purchase order has been approved but has not been marked as
                sent through Tendaflow. Continue only if the supplier received
                the purchase order through another approved method such as
                email, WhatsApp, printed copy, or verbal instruction.
              </p>

              <label className="mt-4 flex items-start gap-3 text-sm text-amber-800">
                <input
                  type="checkbox"
                  checked={confirmExternalPoReceived}
                  onChange={(event) =>
                    setConfirmExternalPoReceived(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-amber-300"
                />

                <span>
                  I confirm the supplier received this purchase order outside
                  Tendaflow.
                </span>
              </label>
            </div>
          </Card>
        )}

        <Card>
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Information
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Add a supplier invoice number, or leave it blank for the system to
            auto-generate one.
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Invoice Number"
              placeholder="Leave blank to auto-generate"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Line Items
          </h2>

          <p className="mt-1 text-sm text-gray-600">
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
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-4">
                    <p className="font-medium text-primary-black">
                      {poItem?.item_name ?? "Item"}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      Ordered quantity: {poItem?.quantity ?? "-"}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr]">
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

                    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
                      <p className="text-sm font-medium text-primary-black">
                        Line Total
                      </p>
                      <p className="mt-2 text-sm text-gray-600">
                        {formatCurrency(lineTotal, purchaseOrder.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Link
            to={
              from === "invoices"
                ? "/invoices"
                : `/purchase-orders/${purchaseOrder.id}`
            }
          >
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </Link>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Creating..." : "Create Invoice"}
          </Button>
        </Card>
      </form>
    </PageContainer>
  );
}
