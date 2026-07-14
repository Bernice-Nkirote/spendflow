import axios from "axios";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";

import { formatCurrency } from "../../../utils/formatCurrency";
import { userHasPermission } from "../../../utils/permissions";

import { getInvoiceById } from "../../invoices/api/invoiceApi";
import type { InvoiceDetails } from "../../invoices/types/invoice.types";
import { createPayment, getPaymentsByInvoice } from "../api/paymentApi";
import {
  clearCreatePaymentDraft,
  useCreatePaymentDraft,
} from "../hooks/useCreatePaymentDraft";
import PaymentBalanceGuidanceCard from "../components/PaymentBalanceGuidanceCard";
import PaymentBalanceSummaryCards from "../components/PaymentBalanceSummaryCards";
import type { PaymentDetails, PaymentMethod } from "../types/payment.types";

const paymentMethods: { label: string; value: PaymentMethod }[] = [
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "M-Pesa", value: "MPESA" },
  { label: "Cash", value: "CASH" },
];

type PaymentNavigationState = {
  from?: string;
  label?: string;
  to?: string;
};

export default function CreatePaymentPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationState = location.state as PaymentNavigationState | null;
  const hasPaymentCreatePermission = userHasPermission("payment.create");

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

  useCreatePaymentDraft({
    invoiceId,
    isReady: Boolean(invoice),
    amount,
    paymentMethod,
    reference,
    setAmount,
    setPaymentMethod,
    setReference,
  });

  useEffect(() => {
    async function fetchInvoice() {
      if (!hasPaymentCreatePermission) {
        setError("You do not have permission to create payments.");
        setLoading(false);
        return;
      }
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
  }, [invoiceId, hasPaymentCreatePermission]);

  if (loading) return <LoadingState />;

  if (!hasPaymentCreatePermission) {
    return (
      <PageContainer className="module-theme module-procurement">
        <BackButton fallbackLabel="Back to Payments" fallbackTo="/payments" />
        <ErrorState message="You do not have permission to create payments." />
      </PageContainer>
    );
  }

  if (error) return <ErrorState message={error} />;

  if (!invoice) {
    return <ErrorState message="Invoice was not found." />;
  }

  const canCreatePayment =
    invoice.status === "APPROVED" || invoice.status === "PARTIALLY_PAID";

  const invoiceCurrency = invoice.currency ?? undefined;
  const invoiceTotal = Number(invoice.total_amount ?? 0);

  const completedPaidTotal = invoicePayments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

  const pendingApprovalTotal = invoicePayments
    .filter((payment) =>
      payment.status === "PENDING_APPROVAL" || payment.status === "APPROVED")
    .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);

  const balanceRemaining = Math.max(
    invoiceTotal - completedPaidTotal - pendingApprovalTotal,
    0,
  );

  const cancelTo = navigationState?.to ?? `/invoices/${invoice.id}`;

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


    try {
      setSaving(true);
      setActionError(null);

      const payment = await createPayment({
        invoice_id: invoiceId,
        amount: numericAmount,
        payment_method: paymentMethod,
        reference: null,
      });

      clearCreatePaymentDraft(invoiceId);

      navigate(`/payments/${payment.id}`, {
        state: navigationState,
      });
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
    <PageContainer className="module-theme module-procurement">
      {actionError && (
        <FloatingAlert
          type="error"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}

      <BackButton
        fallbackLabel="Back to Invoice"
        fallbackTo={`/invoices/${invoice.id}`}
      />

      <PageHeader
        title="Create Payment Request"
        description={`Request approval before paying invoice ${invoice.invoice_number}.`}
      />

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

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Payment Request Details
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Enter the amount and intended payment method. Record the transaction reference after approval, when payment is actually made.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              label="Amount"
              type="number"
              min="0"
              max={balanceRemaining}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={`Maximum: ${formatCurrency(
                balanceRemaining,
                invoiceCurrency,
              )}`}
            />

            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary-black">
                Planned Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as PaymentMethod)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-primary-gray">
              Record the bank, M-Pesa, or cash reference after this payment request is approved and the actual payment has been made.
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(cancelTo)}
              disabled={saving}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={saving || balanceRemaining <= 0}>
              {saving ? "Creating..." : "Create Payment Request"}
            </Button>
          </div>
        </form>
      </Card>
    </PageContainer>
  );
}
