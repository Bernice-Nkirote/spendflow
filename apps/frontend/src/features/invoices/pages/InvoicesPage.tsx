import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Button from "../../../components/ui/Button";

import { getInvoices } from "../api/invoiceApi";
import { getPurchaseOrders } from "../../purchase_orders/api/purchaseOrderApi";
import InvoiceTable from "../components/InvoiceTable";
import type { InvoiceListItem } from "../types/invoice.types";
import type { PurchaseOrderListItem } from "../../purchase_orders/types/purchaseOrder.types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [readyPurchaseOrders, setReadyPurchaseOrders] = useState<
    PurchaseOrderListItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchInvoices() {
    try {
      setLoading(true);
      setError(null);

      const [invoiceResponse, purchaseOrderResponse] = await Promise.all([
        getInvoices(),
        getPurchaseOrders(),
      ]);

      setInvoices(invoiceResponse);

      const invoicedPurchaseOrderIds = new Set(
        invoiceResponse
          .map((invoice) => invoice.purchase_order_id)
          .filter(Boolean),
      );

      setReadyPurchaseOrders(
        purchaseOrderResponse.filter(
          (purchaseOrder) =>
            ["APPROVED", "SENT"].includes(purchaseOrder.status) &&
            !invoicedPurchaseOrderIds.has(purchaseOrder.id),
        ),
      );
    } catch {
      setError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, []);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-primary-black">
            Invoices
          </h1>
          <p className="mt-1 text-sm text-primary-gray">
            Manage invoices created from approved or sent purchase orders.
          </p>
        </div>
      </div>
      <section
        id="ready-for-invoicing"
        className="rounded-xl border bg-white p-4 shadow-sm sm:p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Ready for Invoicing
            </h2>
            <p className="mt-1 text-sm text-primary-gray">
              Approved or sent purchase orders that can be converted into
              invoices.
            </p>
          </div>
        </div>

        {readyPurchaseOrders.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed bg-gray-50 p-4 text-sm text-primary-gray">
            No purchase orders are ready for invoicing. Approved or sent
            purchase orders that have not yet been invoiced will appear here.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                  <th className="px-4 py-3">PO Number</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {readyPurchaseOrders.map((purchaseOrder) => (
                  <tr key={purchaseOrder.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                      {purchaseOrder.po_number}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-gray">
                      {purchaseOrder.supplier_name ?? "Unknown supplier"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-gray">
                      {purchaseOrder.status
                        .toLowerCase()
                        .split("_")
                        .map(
                          (word) =>
                            word.charAt(0).toUpperCase() + word.slice(1),
                        )
                        .join(" ")}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                      {purchaseOrder.total_amount}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <Link
                        to={`/invoices/new?purchaseOrderId=${purchaseOrder.id}&from=invoices`}
                      >
                        <Button variant="secondary">Create Invoice</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {invoices.length === 0 ? (
        <EmptyState
          title="No invoices found"
          message="Invoices will appear here after they are created from approved or sent purchase orders."
        />
      ) : (
        <InvoiceTable invoices={invoices} />
      )}
    </div>
  );
}
