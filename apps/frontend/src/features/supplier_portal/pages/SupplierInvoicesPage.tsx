import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Pagination from "../../../components/ui/Pagination";
import TableWrapper from "../../../components/ui/TableWrapper";
import { formatCurrency } from "../../../utils/formatCurrency";
import { getPaginatedSupplierInvoices } from "../api/supplierPortalApi";
import SupplierInvoiceStatusBadge from "../components/SupplierInvoiceStatusBadge";
import type { SupplierInvoice } from "../types/supplierPortal.types";

function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  async function fetchInvoices() {
    try {
      setRecordsError(null);
      setRecordsLoading(true);

      const skip = (page - 1) * pageSize;

      const response = await getPaginatedSupplierInvoices({
        skip,
        limit: pageSize,
      });

      setInvoices(response.rows);
      setTotalCount(response.total_count);
    } catch {
      setRecordsError("Failed to load supplier invoices.");
    } finally {
      setInitialLoading(false);
      setRecordsLoading(false);
    }
  }

  useEffect(() => {
    fetchInvoices();
  }, [page, pageSize]);

  if (initialLoading) {
    return <LoadingState message="Loading invoices..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-black">
          Supplier Invoices
        </h1>
        <p className="mt-1 text-sm text-primary-gray">
          Track invoices submitted through your supplier portal.
        </p>
      </div>

      {recordsError && <ErrorState message={recordsError} />}

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">Invoices</h2>
          <p className="mt-1 text-sm text-gray-600">
            Review invoice statuses, amounts, and linked purchase orders.
          </p>
        </div>

        {recordsLoading && (
          <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Updating invoices...
          </p>
        )}

        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices found"
            message="Invoices created from your purchase orders will appear here."
          />
        ) : (
          <>
            <TableWrapper minWidth="1100px">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="w-48 whitespace-nowrap px-4 py-3">
                      Invoice Number
                    </th>
                    <th className="w-40 whitespace-nowrap px-4 py-3">
                      PO Number
                    </th>
                    <th className="w-40 whitespace-nowrap px-4 py-3">Status</th>
                    <th className="w-40 whitespace-nowrap px-4 py-3">Amount</th>
                    <th className="w-44 whitespace-nowrap px-4 py-3">
                      Base Amount
                    </th>
                    <th className="w-40 whitespace-nowrap px-4 py-3">
                      Created
                    </th>
                    <th className="w-32 whitespace-nowrap px-4 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50">
                      <td
                        className="truncate px-4 py-3 font-medium text-primary-blue"
                        title={invoice.invoice_number}
                      >
                        {invoice.invoice_number}
                      </td>

                      <td
                        className="truncate px-4 py-3"
                        title={invoice.po_number ?? "-"}
                      >
                        {invoice.po_number ?? "-"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        <SupplierInvoiceStatusBadge status={invoice.status} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {formatCurrency(
                          Number(invoice.total_amount),
                          invoice.currency,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {invoice.base_amount && invoice.base_currency
                          ? formatCurrency(
                              Number(invoice.base_amount),
                              invoice.base_currency,
                            )
                          : "Not available"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/supplier-portal/invoices/${invoice.id}`}
                          className="text-sm font-medium text-primary-blue hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrapper>

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
    </div>
  );
}

export default SupplierInvoicesPage;
