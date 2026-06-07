import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import TableWrapper from "../../../components/ui/TableWrapper";
import MobileRecordCard from "../../../components/ui/MobileRecordCard";
import {
  stickyLeftCell,
  stickyLeftHeader,
} from "../../../components/ui/tableStickyStyles";
import { formatCurrency } from "../../../utils/formatCurrency";
import {
  getSupplierInvoiceByPurchaseOrder,
  getSupplierPurchaseOrder,
} from "../api/supplierPortalApi";
import SupplierPurchaseOrderStatusBadge from "../components/SupplierPurchaseOrderStatusBadge";
import type {
  SupplierPurchaseOrder,
  SupplierInvoice,
} from "../types/supplierPortal.types";

function SupplierPurchaseOrderDetailsPage() {
  const { id } = useParams();

  const [purchaseOrder, setPurchaseOrder] =
    useState<SupplierPurchaseOrder | null>(null);
  const [linkedInvoice, setLinkedInvoice] = useState<SupplierInvoice | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchPurchaseOrder() {
    if (!id) {
      setError("Purchase order is required.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [purchaseOrderData, invoiceData] = await Promise.all([
        getSupplierPurchaseOrder(id),
        getSupplierInvoiceByPurchaseOrder(id),
      ]);

      setPurchaseOrder(purchaseOrderData);
      setLinkedInvoice(invoiceData);
    } catch {
      setError("Failed to load purchase order details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPurchaseOrder();
  }, [id]);

  if (loading) return <LoadingState message="Loading purchase order..." />;

  if (error && !purchaseOrder) return <ErrorState message={error} />;

  if (!purchaseOrder) {
    return (
      <EmptyState
        title="Purchase order not found"
        message="This purchase order could not be found or is no longer available."
      />
    );
  }

  const canCreateInvoice =
    ["APPROVED", "SENT"].includes(purchaseOrder.status) && !linkedInvoice;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <BackButton
            fallbackLabel="Back to Supplier Purchase Orders"
            fallbackTo="/supplier-portal/purchase-orders"
          />

          <p className="mt-4 text-sm text-primary-gray">Purchase Order</p>
          <h1 className="text-2xl font-bold text-primary-black">
            {purchaseOrder.po_number}
          </h1>
          <p className="mt-1 text-sm text-primary-gray">
            Review issued purchase order details and create an invoice when
            eligible.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:items-end">
          {canCreateInvoice ? (
            <Link
              to={`/supplier-portal/purchase-orders/${purchaseOrder.id}/create-invoice`}
            >
              <Button type="button">Create Invoice</Button>
            </Link>
          ) : linkedInvoice ? (
            <>
              <Button type="button" disabled>
                Create Invoice
              </Button>

              <Link to={`/supplier-portal/invoices/${linkedInvoice.id}`}>
                <Button type="button" variant="secondary">
                  View Invoice
                </Button>
              </Link>

              <p className="max-w-xs text-sm text-primary-gray sm:text-right">
                Invoice already exists for this purchase order.
              </p>
            </>
          ) : null}
        </div>
      </div>

      {error && <ErrorState message={error} />}

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Purchase Order Summary
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Key status, amount, and issue information for this purchase order.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Status
            </p>
            <div className="mt-1">
              <SupplierPurchaseOrderStatusBadge status={purchaseOrder.status} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              PO Amount
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {formatCurrency(
                Number(purchaseOrder.total_amount),
                purchaseOrder.currency,
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Base Amount
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {purchaseOrder.base_amount && purchaseOrder.base_currency
                ? formatCurrency(
                    Number(purchaseOrder.base_amount),
                    purchaseOrder.base_currency,
                  )
                : "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Issued Date
            </p>
            <p className="mt-1 font-semibold text-primary-black">
              {purchaseOrder.issued_at
                ? new Date(purchaseOrder.issued_at).toLocaleDateString()
                : "Not issued"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Purchase Order Information
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Supplier and currency details for this purchase order.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {purchaseOrder.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Currency
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {purchaseOrder.currency}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase text-primary-gray">
              Exchange Rate
            </p>
            <p className="mt-1 text-sm font-medium text-primary-black">
              {purchaseOrder.exchange_rate ?? "Not available"}
            </p>
          </div>
        </div>

        {purchaseOrder.notes && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs font-medium uppercase text-primary-gray">
              Notes
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {purchaseOrder.notes}
            </p>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Purchase Order Items
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Line items included in this issued purchase order.
          </p>
        </div>

        {purchaseOrder.items.length === 0 ? (
          <EmptyState
            title="No items found"
            message="This purchase order does not have any line items."
          />
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="space-y-3 lg:hidden">
              {purchaseOrder.items.map((item) => (
                <MobileRecordCard
                  key={item.id}
                  title={item.item_name}
                  subtitle={item.description || "No description"}
                  rows={[
                    {
                      label: "Quantity",
                      value: item.quantity,
                    },
                    {
                      label: "Unit Price",
                      value: formatCurrency(
                        Number(item.unit_price),
                        purchaseOrder.currency,
                      ),
                    },
                    {
                      label: "Total",
                      value: formatCurrency(
                        Number(item.total_price),
                        purchaseOrder.currency,
                      ),
                    },
                  ]}
                />
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden lg:block">
              <TableWrapper minWidth="980px">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th
                        className={`${stickyLeftHeader} w-52 whitespace-nowrap px-4 py-3`}
                      >
                        Item
                      </th>
                      <th className="w-72 whitespace-nowrap px-4 py-3">
                        Description
                      </th>
                      <th className="w-32 whitespace-nowrap px-4 py-3 text-right">
                        Quantity
                      </th>
                      <th className="w-40 whitespace-nowrap px-4 py-3 text-right">
                        Unit Price
                      </th>
                      <th className="w-40 whitespace-nowrap px-4 py-3 text-right">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {purchaseOrder.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td
                          className={`${stickyLeftCell} px-4 py-3 font-medium text-primary-black`}
                        >
                          <span
                            className="block max-w-[200px] truncate"
                            title={item.item_name}
                          >
                            {item.item_name}
                          </span>
                        </td>

                        <td
                          className="truncate px-4 py-3 text-primary-gray"
                          title={item.description || "No description"}
                        >
                          {item.description || "No description"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {item.quantity}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          {formatCurrency(
                            Number(item.unit_price),
                            purchaseOrder.currency,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                          {formatCurrency(
                            Number(item.total_price),
                            purchaseOrder.currency,
                          )}
                        </td>
                      </tr>
                    ))}
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

export default SupplierPurchaseOrderDetailsPage;
