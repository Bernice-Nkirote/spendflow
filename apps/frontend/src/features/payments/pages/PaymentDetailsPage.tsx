import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import BackButton from "../../../components/ui/BackButton";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import StatusBadge from "../../../components/ui/StatusBadge";

import { formatCurrency } from "../../../utils/formatCurrency";
import { getApprovalInstancesByEntity } from "../../approvals/api/approvalApi";
import type { ApprovalInstance } from "../../approvals/types/approval.types";
import { getInvoiceById } from "../../invoices/api/invoiceApi";
import type { InvoiceDetails } from "../../invoices/types/invoice.types";
import { getPaymentById, getPaymentsByInvoice } from "../api/paymentApi";
import PaymentActions from "../components/PaymentActions";
import PaymentStatusBadge from "../components/PaymentStatusBadge";
import type { PaymentDetails } from "../types/payment.types";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRate(value: string | number | null | undefined) {
  if (!value) return "-";

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) return "-";

  return numericValue.toLocaleString("en-KE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 6,
  });
}

function formatPaymentMethod(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getReservedPaymentTotal(payments: PaymentDetails[]) {
  return payments
    .filter(
      (payment) =>
        payment.status === "PENDING_APPROVAL" || payment.status === "COMPLETED",
    )
    .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);
}

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const [payment, setPayment] = useState<PaymentDetails | null>(null);
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [invoicePayments, setInvoicePayments] = useState<PaymentDetails[]>([]);
  const [paymentApproval, setPaymentApproval] =
    useState<ApprovalInstance | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPayment() {
      if (!id) {
        setError("Payment ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const paymentResponse = await getPaymentById(id);
        setPayment(paymentResponse);

        const [invoiceResponse, invoicePaymentResponse, approvalResponse] =
          await Promise.all([
            getInvoiceById(paymentResponse.invoice_id),
            getPaymentsByInvoice(paymentResponse.invoice_id),
            getApprovalInstancesByEntity(paymentResponse.id),
          ]);

        const pendingApproval =
          approvalResponse.find((approval) => approval.status === "PENDING") ??
          null;

        setInvoice(invoiceResponse);
        setInvoicePayments(invoicePaymentResponse);
        setPaymentApproval(pendingApproval);
      } catch {
        setError("Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    }

    fetchPayment();
  }, [id]);

  if (loading) return <LoadingState />;

  if (error) return <ErrorState message={error} />;

  if (!payment) {
    return <ErrorState message="Payment was not found." />;
  }

  const paymentCurrency = payment.currency ?? invoice?.currency ?? undefined;
  const invoiceTotal = Number(invoice?.total_amount ?? 0);
  const reservedTotal = getReservedPaymentTotal(invoicePayments);
  const balanceRemaining = Math.max(invoiceTotal - reservedTotal, 0);

  const hasPendingApproval =
    payment.status === "PENDING_APPROVAL" &&
    paymentApproval?.status === "PENDING";

  return (
    <PageContainer className="module-theme module-finance">
      {actionSuccess && (
        <FloatingAlert
          type="success"
          message={actionSuccess}
          onClose={() => setActionSuccess(null)}
        />
      )}

      {actionError && (
        <FloatingAlert
          type="error"
          message={actionError}
          onClose={() => setActionError(null)}
        />
      )}

      <BackButton fallbackLabel="Back to Payments" fallbackTo="/payments" />

      <PageHeader
        title={`Payment for ${payment.invoice_number ?? "Invoice"}`}
        description={`Supplier: ${payment.supplier_name ?? "Unknown supplier"}`}
        actions={<PaymentStatusBadge status={payment.status} />}
      />

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Payment Actions
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Created {formatDate(payment.created_at)} by{" "}
              {payment.created_by_name ?? "Unknown user"}.
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            {hasPendingApproval ? (
              <>
                <StatusBadge variant="warning">
                  Payment submitted for approval
                </StatusBadge>

                {paymentApproval && (
                  <Link
                    to={`/approvals/${paymentApproval.id}`}
                    state={{
                      from: "payments",
                      label: "Back to Payment",
                      to: `/payments/${payment.id}`,
                    }}
                  >
                    <Button type="button" variant="secondary" size="sm">
                      View Approval Request
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <PaymentActions
                payment={payment}
                onUpdated={(updatedPayment) => {
                  setPayment(updatedPayment);
                  setActionError(null);
                  setActionSuccess(
                    "Payment submitted for approval successfully.",
                  );

                  getApprovalInstancesByEntity(updatedPayment.id).then(
                    (approvals) => {
                      const pendingApproval =
                        approvals.find(
                          (approval) => approval.status === "PENDING",
                        ) ?? null;

                      setPaymentApproval(pendingApproval);
                    },
                  );
                }}
                onDeleted={() => {
                  navigate("/payments");
                }}
                onError={(message) => {
                  setActionSuccess(null);
                  setActionError(message);
                }}
              />
            )}
          </div>
        </div>
      </Card>

      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-sm text-primary-gray">Original Payment</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(Number(payment.amount ?? 0), paymentCurrency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Transaction currency: {paymentCurrency ?? "-"}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Base Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {payment.base_amount && payment.base_currency
              ? formatCurrency(
                  Number(payment.base_amount),
                  payment.base_currency,
                )
              : "-"}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Used for approval thresholds
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Exchange Rate</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatRate(payment.exchange_rate)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            {payment.currency ?? invoice?.currency ?? "-"}
            {payment.base_currency ? ` → ${payment.base_currency}` : ""}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-primary-gray">Balance Remaining</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(balanceRemaining, paymentCurrency)}
          </p>
          <p className="mt-1 text-xs text-primary-gray">
            Rate date: {formatDate(payment.exchange_rate_date)}
          </p>
        </Card>
      </section>

      <Card>
        <h2 className="text-lg font-semibold text-primary-black">
          Payment Information
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Invoice Number
            </p>
            <div className="mt-1 flex flex-col gap-1">
              <p className="text-sm text-primary-black">
                {payment.invoice_number ?? "-"}
              </p>

              <Link
                to={`/invoices/${payment.invoice_id}`}
                state={{
                  from: "payments",
                  label: "Back to Payment",
                  to: location.pathname,
                }}
                className="text-sm font-medium text-primary-blue hover:underline"
              >
                View Invoice
              </Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Supplier
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.supplier_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Amount
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatCurrency(Number(payment.amount ?? 0), paymentCurrency)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Payment Method
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatPaymentMethod(payment.payment_method)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Reference
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.reference ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created By
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {payment.created_by_name ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Status
            </p>

            <div className="mt-2">
              <PaymentStatusBadge status={payment.status} />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Paid At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(payment.paid_at)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              Created At
            </p>
            <p className="mt-1 text-sm text-primary-black">
              {formatDate(payment.created_at)}
            </p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
}
