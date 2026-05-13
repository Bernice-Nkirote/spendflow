import axios from "axios";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import LoadingState from "../../../components/ui/LoadingState";

import { formatCurrency } from "../../../utils/formatCurrency";
import { getInvoiceById } from "../../invoices/api/invoiceApi";
import type { InvoiceDetails } from "../../invoices/types/invoice.types";
import { createPayment, getPaymentsByInvoice } from "../api/paymentApi";
import PaymentBalanceGuidanceCard from "../components/PaymentBalanceGuidanceCard";
import PaymentBalanceSummaryCards from "../components/PaymentBalanceSummaryCards";
import type { PaymentDetails, PaymentMethod } from "../types/payment.types";

const paymentMethods: { label: string; value: PaymentMethod }[] = [
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "M-Pesa", value: "MPESA" },
  { label: "Cash", value: "CASH" },
];

export default function CreatePaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<PaymentDetails[]>([]);

  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("BANK_TRANSFER");
  const [reference, setReference] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInvoice() {
      if (!invoiceId) {
        setError("Invoice ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [invoiceResponse, paymentResponse] = await Promise.all([
          getInvoiceById(invoiceId),
          getPaymentsByInvoice(invoiceId),
        ]);

        setInvoice(invoiceResponse);
        setInvoicePayments(paymentResponse);
      } catch {
        setError("Failed to load invoice details.");
      } finally {
        setLoading(false);
      }
    }

    fetchInvoice();
  }, [invoiceId]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!invoice) {
    return <ErrorState message="Invoice was not found." />;
  }

  const canCreatePayment =
    invoice.status === "APPROVED" || invoice.status === "PARTIALLY_PAID";

  const invoiceCurrency = undefined;

  const invoiceTotal = Number(invoice.total_amount ?? 0);

  const completedPaidTotal = invoicePayments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

  const pendingApprovalTotal = invoicePayments
    .filter((payment) => payment.status === "PENDING_APPROVAL")
    .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

  const balanceRemaining = Math.max(
    invoiceTotal - completedPaidTotal - pendingApprovalTotal,
    0,
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!invoiceId) {
      setActionError("Invoice ID is missing.");
      return;
    }

    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      setActionError("Enter a valid payment amount.");
      return;
    }

    if (numericAmount > balanceRemaining) {
      setActionError(
        `Payment amount cannot exceed the remaining balance of ${formatCurrency(
          balanceRemaining,
          invoiceCurrency,
        )}.`,
      );
      return;
    }

    if (
      (paymentMethod === "BANK_TRANSFER" || paymentMethod === "MPESA") &&
      !reference.trim()
    ) {
      setActionError("Reference is required for this payment method.");
      return;
    }

    try {
      setSaving(true);
      setActionError(null);

      const payment = await createPayment({
        invoice_id: invoiceId,
        amount: numericAmount,
        payment_method: paymentMethod,
        reference: reference.trim() || null,
      });

      navigate(`/payments/${payment.id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setActionError(
          error.response?.data?.detail ?? "Failed to create payment.",
        );
      } else {
        setActionError("Failed to create payment.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (!canCreatePayment) {
    return (
      <ErrorState message="Payments can only be created for approved or partially paid invoices." />
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {actionError && (
        <FloatingAlert
          type="error"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}

      <div className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
        <Link
          to={`/invoices/${invoice.id}`}
          className="text-sm font-medium text-primary-blue hover:underline"
        >
          ← Back to Invoice
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-primary-black">
          Create Payment
        </h1>

        <p className="mt-1 text-sm text-primary-gray">
          Create a payment record for invoice {invoice.invoice_number}.
        </p>
      </div>

      <PaymentBalanceSummaryCards
        invoiceNumber={invoice.invoice_number}
        supplierName={invoice.supplier_name}
        completedPaidTotal={completedPaidTotal}
        balanceRemaining={balanceRemaining}
        currency={invoiceCurrency}
      />

      <PaymentBalanceGuidanceCard
        invoiceTotal={invoiceTotal}
        pendingApprovalTotal={pendingApprovalTotal}
        balanceRemaining={balanceRemaining}
        currency={invoiceCurrency}
      />

      <form
        onSubmit={handleSubmit}
        className="rounded-xl border bg-white p-4 shadow-sm sm:p-5"
      >
        <h2 className="text-lg font-semibold text-primary-black">
          Payment Details
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-primary-black">
              Amount
            </label>
            <input
              type="number"
              min="0"
              max={balanceRemaining}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
              placeholder={`Maximum: ${formatCurrency(
                balanceRemaining,
                invoiceCurrency,
              )}`}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-primary-black">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod)
              }
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-primary-black">
              Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-primary-blue"
              placeholder="Example: BANK-REF-001 or MPESA-REF-001"
            />
            <p className="mt-1 text-xs text-primary-gray">
              Required for Bank Transfer and M-Pesa payments.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            to={`/invoices/${invoice.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-primary-black hover:bg-gray-50"
          >
            Cancel
          </Link>

          <Button type="submit" disabled={saving || balanceRemaining <= 0}>
            {saving ? "Creating..." : "Create Payment"}
          </Button>
        </div>
      </form>
    </div>
  );
}
