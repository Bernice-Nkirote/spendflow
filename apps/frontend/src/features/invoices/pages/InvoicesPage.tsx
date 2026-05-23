import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";
import TableWrapper from "../../../components/ui/TableWrapper";
import { userHasPermission } from "../../../utils/permissions";

import { formatCurrency } from "../../../utils/formatCurrency";
import { getPaginatedInvoices } from "../api/invoiceApi";
import { getPurchaseOrders } from "../../purchase_orders/api/purchaseOrderApi";
import PurchaseOrderStatusBadge from "../../purchase_orders/components/PurchaseOrderStatusBadge";
import InvoiceTable from "../components/InvoiceTable";

import type { InvoiceListItem } from "../types/invoice.types";
import type { PurchaseOrderListItem } from "../../purchase_orders/types/purchaseOrder.types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [readyPurchaseOrders, setReadyPurchaseOrders] = useState<
    PurchaseOrderListItem[]
  >([]);

  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const skip = (page - 1) * pageSize;
  const canCreateInvoice = userHasPermission("invoice.create");

  useEffect(() => {
    async function fetchInvoicesPageData() {
      try {
        setInitialLoading(true);
        setError(null);

        const [invoiceResponse, purchaseOrderResponse] = await Promise.all([
          getPaginatedInvoices({ skip: 0, limit: 100 }),
          getPurchaseOrders(),
        ]);

        const invoicedPurchaseOrderIds = new Set(
          invoiceResponse.rows
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
        setError("Failed to load invoice page data.");
      } finally {
        setInitialLoading(false);
      }
    }

    fetchInvoicesPageData();
  }, []);

  useEffect(() => {
    async function fetchInvoiceRecords() {
      try {
        setRecordsLoading(true);
        setRecordsError(null);

        const invoiceResponse = await getPaginatedInvoices({
          skip,
          limit: pageSize,
        });

        setInvoices(invoiceResponse.rows);
        setTotalCount(invoiceResponse.total_count);
      } catch {
        setRecordsError("Failed to load invoices.");
      } finally {
        setRecordsLoading(false);
      }
    }

    fetchInvoiceRecords();
  }, [skip, pageSize]);

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description="Manage invoices created from approved or sent purchase orders."
      />

      {initialLoading && <LoadingState />}

      {!initialLoading && error && <ErrorState message={error} />}

      {!initialLoading && !error && (
        <>
          {canCreateInvoice && (
            <Card>
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
                  purchase orders that have not yet been invoiced will appear
                  here.
                </div>
              ) : (
                <div className="mt-4">
                  <TableWrapper minWidth="850px">
                    <table className="w-full divide-y divide-gray-200 bg-white text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                            PO Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                            Supplier
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                            Status
                          </th>
                          <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-gray-100 bg-white">
                        {readyPurchaseOrders.map((purchaseOrder) => (
                          <tr
                            key={purchaseOrder.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                              {purchaseOrder.po_number}
                            </td>

                            <td className="px-4 py-3 text-primary-black">
                              {purchaseOrder.supplier_name ??
                                "Unknown supplier"}
                            </td>

                            <td className="px-4 py-3">
                              <PurchaseOrderStatusBadge
                                status={purchaseOrder.status}
                              />
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                              {formatCurrency(
                                Number(purchaseOrder.total_amount ?? 0),
                                purchaseOrder.currency,
                              )}
                            </td>

                            <td className="whitespace-nowrap px-4 py-3 text-right">
                              <Link
                                to={`/invoices/new?purchaseOrderId=${purchaseOrder.id}&from=invoices`}
                              >
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                >
                                  Create Invoice
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableWrapper>
                </div>
              )}
            </Card>
          )}

          <Card>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-black">
                Invoice List
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Track invoices created from approved or sent purchase orders.
              </p>
            </div>

            {recordsLoading && invoices.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating invoices...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : invoices.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No invoices found"
                message="Invoices will appear here after they are created from approved or sent purchase orders."
              />
            ) : (
              <>
                <InvoiceTable invoices={invoices} />

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={setPage}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize);
                    setPage(1);
                  }}
                />
              </>
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
}
