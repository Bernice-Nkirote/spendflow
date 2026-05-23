import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Pagination from "../../../components/ui/Pagination";
import TableWrapper from "../../../components/ui/TableWrapper";
import { formatCurrency } from "../../../utils/formatCurrency";
import { getPaginatedSupplierPurchaseOrders } from "../api/supplierPortalApi";
import SupplierPurchaseOrderStatusBadge from "../components/SupplierPurchaseOrderStatusBadge";
import type { SupplierPurchaseOrder } from "../types/supplierPortal.types";

function SupplierPurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<SupplierPurchaseOrder[]>(
    [],
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  async function fetchPurchaseOrders() {
    try {
      setRecordsError(null);
      setRecordsLoading(true);

      const skip = (page - 1) * pageSize;

      const response = await getPaginatedSupplierPurchaseOrders({
        skip,
        limit: pageSize,
      });

      setPurchaseOrders(response.rows);
      setTotalCount(response.total_count);
    } catch {
      setRecordsError("Failed to load supplier purchase orders.");
    } finally {
      setInitialLoading(false);
      setRecordsLoading(false);
    }
  }

  useEffect(() => {
    fetchPurchaseOrders();
  }, [page, pageSize]);

  if (initialLoading) {
    return <LoadingState message="Loading purchase orders..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-black">
          Supplier Purchase Orders
        </h1>
        <p className="mt-1 text-sm text-primary-gray">
          View purchase orders issued to your supplier account.
        </p>
      </div>

      {recordsError && <ErrorState message={recordsError} />}

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">
            Purchase Orders
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Review issued purchase orders and open details to create invoices.
          </p>
        </div>

        {recordsLoading && (
          <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Updating purchase orders...
          </p>
        )}

        {purchaseOrders.length === 0 ? (
          <EmptyState
            title="No purchase orders found"
            message="Purchase orders issued to your supplier account will appear here."
          />
        ) : (
          <>
            <TableWrapper minWidth="980px">
              <table className="w-full table-fixed text-left text-sm">
                <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="w-44 whitespace-nowrap px-4 py-3">
                      PO Number
                    </th>
                    <th className="w-40 whitespace-nowrap px-4 py-3">Status</th>
                    <th className="w-40 whitespace-nowrap px-4 py-3">Amount</th>
                    <th className="w-44 whitespace-nowrap px-4 py-3">
                      Base Amount
                    </th>
                    <th className="w-40 whitespace-nowrap px-4 py-3">
                      Issued At
                    </th>
                    <th className="w-32 whitespace-nowrap px-4 py-3 text-right">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td
                        className="truncate px-4 py-3 font-medium text-primary-blue"
                        title={po.po_number}
                      >
                        {po.po_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <SupplierPurchaseOrderStatusBadge status={po.status} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatCurrency(Number(po.total_amount), po.currency)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {po.base_amount && po.base_currency
                          ? formatCurrency(
                              Number(po.base_amount),
                              po.base_currency,
                            )
                          : "Not available"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {po.issued_at
                          ? new Date(po.issued_at).toLocaleDateString()
                          : "Not issued"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`/supplier-portal/purchase-orders/${po.id}`}
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

export default SupplierPurchaseOrdersPage;
