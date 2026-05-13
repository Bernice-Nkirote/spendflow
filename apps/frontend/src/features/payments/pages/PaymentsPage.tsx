import { useEffect, useMemo, useState } from "react";

import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import { getInvoices } from "../../invoices/api/invoiceApi";
import type { InvoiceListItem } from "../../invoices/types/invoice.types";

import { getPayments } from "../api/paymentApi";
import ApprovedInvoicesReadyForPaymentTable from "../components/ApprovedInvoicesReadyForPaymentTable";
import PartiallyPaidInvoicesOutstandingTable from "../components/PartiallyPaidInvoicesOutstandingTable";
import PaymentRecordsTable from "../components/PaymentRecordsTable";
import type { PaymentListItem } from "../types/payment.types";
import { getReservedPaymentTotal } from "../components/paymentTableHelpers";

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentListItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPaymentPageData() {
      try {
        setLoading(true);
        setError(null);

        const [paymentResponse, invoiceResponse] = await Promise.all([
          getPayments(),
          getInvoices(),
        ]);

        setPayments(paymentResponse);
        setInvoices(invoiceResponse);
      } catch {
        setError("Failed to load payments.");
      } finally {
        setLoading(false);
      }
    }

    fetchPaymentPageData();
  }, []);

  const approvedInvoicesReadyForPayment = useMemo(() => {
    return invoices.filter((invoice) => {
      if (invoice.status !== "APPROVED") return false;

      const invoiceTotal = Number(invoice.total_amount ?? 0);
      const reservedTotal = getReservedPaymentTotal(invoice.id, payments);
      const balanceRemaining = Math.max(invoiceTotal - reservedTotal, 0);

      return balanceRemaining > 0;
    });
  }, [invoices, payments]);

  const partiallyPaidInvoicesWithOutstandingBalance = useMemo(() => {
    return invoices.filter((invoice) => {
      if (invoice.status !== "PARTIALLY_PAID") return false;

      const invoiceTotal = Number(invoice.total_amount ?? 0);
      const reservedTotal = getReservedPaymentTotal(invoice.id, payments);
      const balanceRemaining = Math.max(invoiceTotal - reservedTotal, 0);

      return balanceRemaining > 0;
    });
  }, [invoices, payments]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-2xl font-semibold text-primary-black">Payments</h1>
        <p className="mt-1 text-sm text-primary-gray">
          Create payments from approved invoices, continue partially paid
          invoices, and track payment approval status.
        </p>
      </div>

      <ApprovedInvoicesReadyForPaymentTable
        invoices={approvedInvoicesReadyForPayment}
        payments={payments}
      />

      <PartiallyPaidInvoicesOutstandingTable
        invoices={partiallyPaidInvoicesWithOutstandingBalance}
        payments={payments}
      />

      <PaymentRecordsTable payments={payments} />
    </div>
  );
}
