import { useEffect, useState } from "react";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import Pagination from "../../../components/ui/Pagination";
import TableWrapper from "../../../components/ui/TableWrapper";
import MobileRecordCard from "../../../components/ui/MobileRecordCard";
import {
  stickyLeftCell,
  stickyLeftHeader,
} from "../../../components/ui/tableStickyStyles";
import { formatCurrency } from "../../../utils/formatCurrency";
import { getPaginatedSupplierPayments } from "../api/supplierPortalApi";
import SupplierPaymentStatusBadge from "../components/SupplierPaymentStatusBadge";
import type { SupplierPayment } from "../types/supplierPortal.types";
import { formatSupplierEnum } from "../utils/formatSupplierEnum";

function SupplierPaymentsPage() {
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  async function fetchPayments() {
    try {
      setRecordsError(null);
      setRecordsLoading(true);

      const skip = (page - 1) * pageSize;

      const response = await getPaginatedSupplierPayments({
        skip,
        limit: pageSize,
      });

      setPayments(response.rows);
      setTotalCount(response.total_count);
    } catch {
      setRecordsError("Failed to load supplier payments.");
    } finally {
      setInitialLoading(false);
      setRecordsLoading(false);
    }
  }

  useEffect(() => {
    fetchPayments();
  }, [page, pageSize]);

  if (initialLoading) {
    return <LoadingState message="Loading payments..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary-black">
          Supplier Payments
        </h1>
        <p className="mt-1 text-sm text-primary-gray">
          View payment records linked to your supplier invoices.
        </p>
      </div>

      {recordsError && <ErrorState message={recordsError} />}

      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary-black">Payments</h2>
          <p className="mt-1 text-sm text-gray-600">
            Review payment references, methods, statuses, and amounts.
          </p>
        </div>

        {recordsLoading && (
          <p className="mb-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Updating payments...
          </p>
        )}

        {payments.length === 0 ? (
          <EmptyState
            title="No payments found"
            message="Payments made against your supplier invoices will appear here."
          />
        ) : (
          <>
            <div className="space-y-3 lg:hidden">
              <>
                <div className="space-y-3 lg:hidden">
                  {payments.map((payment) => (
                    <MobileRecordCard
                      key={payment.id}
                      title={payment.invoice_number ?? "Invoice not available"}
                      subtitle={payment.reference ?? "Reference not provided"}
                      rows={[
                        {
                          label: "Method",
                          value: formatSupplierEnum(payment.payment_method),
                        },
                        {
                          label: "Status",
                          value: (
                            <SupplierPaymentStatusBadge
                              status={payment.status}
                            />
                          ),
                        },
                        {
                          label: "Amount",
                          value: formatCurrency(
                            Number(payment.amount),
                            payment.currency,
                          ),
                        },
                        {
                          label: "Base Amount",
                          value:
                            payment.base_amount && payment.base_currency
                              ? formatCurrency(
                                  Number(payment.base_amount),
                                  payment.base_currency,
                                )
                              : "Not available",
                        },
                        {
                          label: "Paid At",
                          value: payment.paid_at
                            ? new Date(payment.paid_at).toLocaleDateString()
                            : "-",
                        },
                      ]}
                    />
                  ))}
                </div>

                <div className="hidden lg:block">
                  <TableWrapper minWidth="1100px">
                    <table className="w-full table-fixed text-left text-sm">
                      {/* keep your existing table exactly as it is */}
                    </table>
                  </TableWrapper>
                </div>
              </>
            </div>
            <div className="hidden lg:block">
              <TableWrapper minWidth="1100px">
                <table className="w-full table-fixed text-left text-sm">
                  <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      <th
                        className={`${stickyLeftHeader} w-64 whitespace-nowrap px-4 py-3`}
                      >
                        Invoice Number
                      </th>
                      <th className="w-44 whitespace-nowrap px-4 py-3">
                        Reference
                      </th>
                      <th className="w-40 whitespace-nowrap px-4 py-3">
                        Method
                      </th>
                      <th className="w-40 whitespace-nowrap px-4 py-3">
                        Status
                      </th>
                      <th className="w-40 whitespace-nowrap px-4 py-3">
                        Amount
                      </th>
                      <th className="w-44 whitespace-nowrap px-4 py-3">
                        Base Amount
                      </th>
                      <th className="w-40 whitespace-nowrap px-4 py-3">
                        Paid At
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {payments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td
                          className={`${stickyLeftCell} px-4 py-3 font-medium text-primary-blue`}
                          title={payment.invoice_number ?? "-"}
                        >
                          <span className="block whitespace-nowrap">
                            {payment.invoice_number ?? "-"}
                          </span>
                        </td>

                        <td
                          className="px-4 py-3"
                          title={payment.reference ?? "Not provided"}
                        >
                          <span className="block max-w-[220px] truncate">
                            {payment.reference ?? "Not provided"}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          {formatSupplierEnum(payment.payment_method)}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <SupplierPaymentStatusBadge status={payment.status} />
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          {formatCurrency(
                            Number(payment.amount),
                            payment.currency,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          {payment.base_amount && payment.base_currency
                            ? formatCurrency(
                                Number(payment.base_amount),
                                payment.base_currency,
                              )
                            : "Not available"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          {payment.paid_at
                            ? new Date(payment.paid_at).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrapper>
            </div>
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

export default SupplierPaymentsPage;
