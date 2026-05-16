import axios from "axios";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import { formatCurrency } from "../../../utils/formatCurrency";
import {
  getSupplierInvoice,
  submitSupplierInvoice,
  updateSupplierInvoice,
} from "../api/supplierPortalApi";
import SupplierInvoiceStatusBadge from "../components/SupplierInvoiceStatusBadge";

type SupplierInvoiceLineItem = {
  id: string;
  purchase_order_item_id: string;
  description: string;
  invoiced_quantity: string;
  unit_price: string;
  total_price: string;
};

type SupplierInvoice = {
  id: string;
  invoice_number: string;
  po_number?: string | null;
  supplier_name?: string | null;
  submitted_by_supplier_user_name?: string | null;
  status: string;
  total_amount: string;
  currency: string;
  base_amount?: string | null;
  base_currency?: string | null;
  exchange_rate?: string | null;
  exchange_rate_date?: string | null;
  created_at: string;
  updated_at: string;
  line_items: SupplierInvoiceLineItem[];
};

function SupplierInvoiceDetailsPage() {
  const { id } = useParams();

  const [invoice, setInvoice] = useState<SupplierInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableItems, setEditableItems] = useState<SupplierInvoiceLineItem[]>(
    [],
  );
  const [error, setError] = useState("");

  async function loadInvoice() {
    if (!id) return;

    try {
      setLoading(true);
      setError("");

      const data = await getSupplierInvoice(id);
      setInvoice(data);
      setEditableItems(data.line_items);
    } catch {
      setError("Failed to load invoice details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoice();
  }, [id]);

  async function handleSubmitInvoice() {
    if (!invoice) return;

    try {
      setSubmitting(true);
      setError("");

      const submittedInvoice = await submitSupplierInvoice(invoice.id);
      setInvoice(submittedInvoice);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Failed to submit invoice for approval.",
        );
        return;
      }

      setError("Failed to submit invoice for approval.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleEditLineItem(
    index: number,
    field: keyof SupplierInvoiceLineItem,
    value: string,
  ) {
    setEditableItems((current) =>
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

  function handleCancelEdit() {
    if (!invoice) return;

    setEditableItems(invoice.line_items);
    setIsEditing(false);
    setError("");
  }

  async function handleSaveInvoiceChanges() {
    if (!invoice) return;

    if (editableItems.length === 0) {
      setError("At least one invoice line item is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const updatedInvoice = await updateSupplierInvoice(invoice.id, {
        line_items: editableItems.map((item) => ({
          purchase_order_item_id: item.purchase_order_item_id,
          description: item.description,
          invoiced_quantity: item.invoiced_quantity,
          unit_price: item.unit_price,
        })),
      });

      setInvoice(updatedInvoice);
      setEditableItems(updatedInvoice.line_items);
      setIsEditing(false);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          err.response?.data?.detail ||
            "Failed to update invoice. Please try again.",
        );
        return;
      }

      setError("Failed to update invoice. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Loading invoice..." />;

  if (error && !invoice) return <ErrorState message={error} />;

  if (!invoice) {
    return (
      <EmptyState
        title="Invoice not found"
        message="This invoice could not be found or is no longer available."
      />
    );
  }

  const canModify = ["DRAFT", "REJECTED"].includes(invoice.status);
  const canSubmit = canModify && !isEditing;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <Link
            to="/supplier-portal/invoices"
            className="text-sm font-medium text-primary-blue hover:underline"
          >
            ← Back to Supplier Invoices
          </Link>

          <p className="mt-4 text-sm text-primary-gray">Invoice</p>
          <h1 className="text-2xl font-bold text-primary-black">
            {invoice.invoice_number}
          </h1>
          <p className="mt-1 text-sm text-primary-gray">
            Track invoice details, approval status, and submitted line items.
          </p>
        </div>

        {canModify && (
          <div className="flex flex-col gap-2 sm:flex-row">
            {isEditing ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancelEdit}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={handleSaveInvoiceChanges}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Invoice
                </Button>

                {canSubmit && (
                  <Button onClick={handleSubmitInvoice} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit for Approval"}
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {error && <ErrorState message={error} />}

      <Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Status
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              <SupplierInvoiceStatusBadge status={invoice.status} />
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Purchase Order
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {invoice.po_number ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Invoice Amount
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {formatCurrency(Number(invoice.total_amount), invoice.currency)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Base Amount
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {invoice.base_amount && invoice.base_currency
                ? formatCurrency(
                    Number(invoice.base_amount),
                    invoice.base_currency,
                  )
                : "Not available"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-primary-black">
          Invoice Information
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {invoice.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Submitted By
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {invoice.submitted_by_supplier_user_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Created
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-primary-black">
          Invoice Line Items
        </h2>

        {invoice.line_items.length === 0 ? (
          <EmptyState
            title="No line items found"
            message="This invoice does not have any line items."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Unit Price
                  </th>
                  <th className="px-4 py-3 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {(isEditing ? editableItems : invoice.line_items).map(
                  (item, index) => {
                    const lineTotal =
                      Number(item.invoiced_quantity || 0) *
                      Number(item.unit_price || 0);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-primary-black">
                          {isEditing ? (
                            <Input
                              label=""
                              value={item.description}
                              onChange={(event) =>
                                handleEditLineItem(
                                  index,
                                  "description",
                                  event.target.value,
                                )
                              }
                            />
                          ) : (
                            item.description
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input
                              label=""
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.invoiced_quantity}
                              onChange={(event) =>
                                handleEditLineItem(
                                  index,
                                  "invoiced_quantity",
                                  event.target.value,
                                )
                              }
                            />
                          ) : (
                            item.invoiced_quantity
                          )}
                        </td>

                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <Input
                              label=""
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(event) =>
                                handleEditLineItem(
                                  index,
                                  "unit_price",
                                  event.target.value,
                                )
                              }
                            />
                          ) : (
                            formatCurrency(
                              Number(item.unit_price),
                              invoice.currency,
                            )
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-medium">
                          {formatCurrency(lineTotal, invoice.currency)}
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

export default SupplierInvoiceDetailsPage;
