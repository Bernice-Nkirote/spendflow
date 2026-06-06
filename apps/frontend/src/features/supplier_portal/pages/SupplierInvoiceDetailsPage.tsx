import axios from "axios";
import { useEffect, useState } from "react";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import TableWrapper from "../../../components/ui/TableWrapper";
import MobileRecordCard from "../../../components/ui/MobileRecordCard";
import {
  stickyLeftCell,
  stickyLeftHeader,
} from "../../../components/ui/tableStickyStyles";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { formatCurrency } from "../../../utils/formatCurrency";
import {
  getSupplierInvoice,
  submitSupplierInvoice,
  updateSupplierInvoice,
} from "../api/supplierPortalApi";
import SupplierInvoiceStatusBadge from "../components/SupplierInvoiceStatusBadge";
import type {
  SupplierInvoice,
  SupplierInvoiceLineItem,
} from "../types/supplierPortal.types";
import { useParams } from "react-router-dom";

function SupplierInvoiceDetailsPage() {
  const { id } = useParams();
  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const [invoice, setInvoice] = useState<SupplierInvoice | null>(null);
  const [editableItems, setEditableItems] = useState<SupplierInvoiceLineItem[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");

  async function loadInvoice() {
    if (!id) {
      setError("Invoice is required.");
      setLoading(false);
      return;
    }

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
      clearAlert();

      const submittedInvoice = await submitSupplierInvoice(invoice.id);

      setInvoice(submittedInvoice);
      setEditableItems(submittedInvoice.line_items);
      showAlert("success", "Invoice submitted for approval successfully.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        showAlert(
          "error",
          err.response?.data?.detail ||
            "Failed to submit invoice for approval.",
        );
        return;
      }

      showAlert("error", "Failed to submit invoice for approval.");
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
    clearAlert();
  }

  async function handleSaveInvoiceChanges() {
    if (!invoice) return;

    if (editableItems.length === 0) {
      showAlert("error", "At least one invoice line item is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      clearAlert();

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

      showAlert("success", "Invoice updated successfully.");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        showAlert(
          "error",
          err.response?.data?.detail ||
            "Failed to update invoice. Please try again.",
        );
        return;
      }

      showAlert("error", "Failed to update invoice. Please try again.");
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
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <BackButton
            fallbackLabel="Back to Supplier Invoices"
            fallbackTo="/supplier-portal/invoices"
          />

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
                  <Button
                    type="button"
                    onClick={handleSubmitInvoice}
                    disabled={submitting}
                  >
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Summary
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Key status, purchase order, and amount information.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Status
            </p>
            <div className="mt-1">
              <SupplierInvoiceStatusBadge status={invoice.status} />
            </div>
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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Information
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Supplier, submitter, and date details.
          </p>
        </div>

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
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Invoice Line Items
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Review or edit invoice line items while the invoice is editable.
          </p>
        </div>

        {invoice.line_items.length === 0 ? (
          <EmptyState
            title="No line items found"
            message="This invoice does not have any line items."
          />
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              {(isEditing ? editableItems : invoice.line_items).map(
                (item, index) => {
                  const lineTotal =
                    Number(item.invoiced_quantity || 0) *
                    Number(item.unit_price || 0);

                  return (
                    <MobileRecordCard
                      key={item.id}
                      title={item.description || "Invoice item"}
                      rows={[
                        {
                          label: "Invoice Quantity",
                          value: isEditing ? (
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
                          ),
                        },
                        {
                          label: "Unit Price",
                          value: isEditing ? (
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
                          ),
                        },
                        {
                          label: "Line Total",
                          value: formatCurrency(lineTotal, invoice.currency),
                        },
                      ]}
                      actions={
                        isEditing ? (
                          <Input
                            label="Description"
                            value={item.description}
                            onChange={(event) =>
                              handleEditLineItem(
                                index,
                                "description",
                                event.target.value,
                              )
                            }
                          />
                        ) : undefined
                      }
                    />
                  );
                },
              )}
            </div>

            <div className="hidden lg:block">
              <TableWrapper minWidth="980px">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th
                        className={`${stickyLeftHeader} w-72 whitespace-nowrap px-4 py-3`}
                      >
                        Description
                      </th>
                      <th className="w-40 whitespace-nowrap px-4 py-3 text-right">
                        Quantity
                      </th>
                      <th className="w-44 whitespace-nowrap px-4 py-3 text-right">
                        Unit Price
                      </th>
                      <th className="w-40 whitespace-nowrap px-4 py-3 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {(isEditing ? editableItems : invoice.line_items).map(
                      (item, index) => {
                        const lineTotal =
                          Number(item.invoiced_quantity || 0) *
                          Number(item.unit_price || 0);

                        return (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td
                              className={`${stickyLeftCell} px-4 py-3 font-medium text-primary-black`}
                            >
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
                                <span
                                  title={item.description}
                                  className="truncate"
                                >
                                  {item.description}
                                </span>
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
                                <span className="whitespace-nowrap">
                                  {item.invoiced_quantity}
                                </span>
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
                                <span className="whitespace-nowrap">
                                  {formatCurrency(
                                    Number(item.unit_price),
                                    invoice.currency,
                                  )}
                                </span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                              {formatCurrency(lineTotal, invoice.currency)}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </TableWrapper>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

export default SupplierInvoiceDetailsPage;
