import { useEffect, useMemo, useState } from "react";

import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";
import { userHasPermission } from "../../../utils/permissions";

import { getInvoices } from "../../invoices/api/invoiceApi";
import type { InvoiceListItem } from "../../invoices/types/invoice.types";

import { getPaginatedPayments, getPayments } from "../api/paymentApi";
import ApprovedInvoicesReadyForPaymentTable from "../components/ApprovedInvoicesReadyForPaymentTable";
import PartiallyPaidInvoicesOutstandingTable from "../components/PartiallyPaidInvoicesOutstandingTable";
import PaymentRecordsTable from "../components/PaymentRecordsTable";
import { getReservedPaymentTotal } from "../components/paymentTableHelpers";
import type { PaymentListItem } from "../types/payment.types";

const PAYMENT_READY_INVOICE_LIMIT = 5;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [allPaymentsForBalance, setAllPaymentsForBalance] = useState<
    PaymentListItem[]
  >([]);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);

  const [totalCount, setTotalCount] = useState(0);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [recordsError, setRecordsError] = useState<string | null>(null);

  const skip = (page - 1) * pageSize;
  const canCreatePayment = userHasPermission("payment.create");

  useEffect(() => {
    async function fetchPaymentGuidanceData() {
      try {
        setInitialLoading(true);
        setError(null);

        const [allPaymentResponse, invoiceResponse] = await Promise.all([
          getPayments(),
          getInvoices(),
        ]);

        setAllPaymentsForBalance(allPaymentResponse);
        setInvoices(invoiceResponse);
      } catch {
        setError("Failed to load payment guidance data.");
      } finally {
        setInitialLoading(false);
      }
    }

    fetchPaymentGuidanceData();
  }, []);

  useEffect(() => {
    async function fetchPaymentRecords() {
      try {
        setRecordsLoading(true);
        setRecordsError(null);

        const response = await getPaginatedPayments({
          skip,
          limit: pageSize,
        });

        setPayments(response.rows);
        setTotalCount(response.total_count);
      } catch {
        setRecordsError("Failed to load payment records.");
      } finally {
        setRecordsLoading(false);
      }
    }

    fetchPaymentRecords();
  }, [skip, pageSize]);

  const approvedInvoicesReadyForPayment = useMemo(() => {
    return invoices.filter((invoice) => {
      if (invoice.status !== "APPROVED") return false;

      const invoiceTotal = Number(invoice.total_amount ?? 0);
      const reservedTotal = getReservedPaymentTotal(
        invoice.id,
        allPaymentsForBalance,
      );
      const balanceRemaining = Math.max(invoiceTotal - reservedTotal, 0);

      return balanceRemaining > 0;
    });
  }, [invoices, allPaymentsForBalance]);

  const partiallyPaidInvoicesWithOutstandingBalance = useMemo(() => {
    return invoices.filter((invoice) => {
      if (invoice.status !== "PARTIALLY_PAID") return false;

      const invoiceTotal = Number(invoice.total_amount ?? 0);
      const reservedTotal = getReservedPaymentTotal(
        invoice.id,
        allPaymentsForBalance,
      );
      const balanceRemaining = Math.max(invoiceTotal - reservedTotal, 0);

      return balanceRemaining > 0;
    });
  }, [invoices, allPaymentsForBalance]);

  return (
    <PageContainer className="module-theme module-procurement">
      <PageHeader
        title="Payments"
        description="Create payments from approved invoices, continue partially paid invoices, and track payment approval status."
      />

      {initialLoading && <LoadingState />}

      {!initialLoading && error && <ErrorState message={error} />}

      {!initialLoading && !error && (
        <>
          {canCreatePayment && (
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-primary-black">
                  Ready for First Payment
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Approved invoices with an outstanding balance and no completed
                  payment yet.
                </p>

                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                  Approved invoices ready for payment:{" "}
                  <span className="font-semibold">
                    {approvedInvoicesReadyForPayment.length}
                  </span>
                </div>
              </div>

              <ApprovedInvoicesReadyForPaymentTable
                invoices={approvedInvoicesReadyForPayment.slice(
                  0,
                  PAYMENT_READY_INVOICE_LIMIT,
                )}
                payments={allPaymentsForBalance}
              />
            </Card>
          )}
          {canCreatePayment && (
            <Card>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-primary-black">
                  Partially Paid Invoices
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  Continue payments for invoices that already have a completed
                  payment but still have an outstanding balance.
                </p>

                <div className="mt-3 rounded-xl border border-yellow-100 bg-yellow-50 px-4 py-3 text-sm text-yellow-700">
                  Partially paid invoices with outstanding balance:{" "}
                  <span className="font-semibold">
                    {partiallyPaidInvoicesWithOutstandingBalance.length}
                  </span>
                </div>
              </div>

              <PartiallyPaidInvoicesOutstandingTable
                invoices={partiallyPaidInvoicesWithOutstandingBalance.slice(
                  0,
                  PAYMENT_READY_INVOICE_LIMIT,
                )}
                payments={allPaymentsForBalance}
              />
            </Card>
          )}

          <Card id="payment-records-section">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-primary-black">
                Payment Records
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Track created payments, approval status, method, reference, and
                creator.
              </p>
            </div>

            {recordsLoading && payments.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating payment records...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : payments.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No payments found"
                message="Payments will appear here after they are created from approved or partially paid invoices."
              />
            ) : (
              <>
                <PaymentRecordsTable payments={payments} />

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={setPage}
                  onPageSizeChange={(nextPageSize) => {
                    setPageSize(nextPageSize);
                    setPage(1);

                    window.requestAnimationFrame(() => {
                      document
                        .getElementById("payment-records-section")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    });
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
