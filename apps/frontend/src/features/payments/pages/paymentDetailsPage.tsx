import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import FloatingAlert from "../../../components/ui/FloatingAlert";

import { formatCurrency } from "../../../utils/formatCurrency";
import { getPaymentById, getPaymentsByInvoice } from "../api/paymentApi";
import { getInvoiceById } from "../../invoices/api/invoiceApi";
import type { InvoiceDetails } from "../../invoices/types/invoice.types";
import type { PaymentDetails } from "../types/payment.types";
import { getApprovalInstancesByEntity } from "../../approvals/api/approvalApi";
import type { ApprovalInstance } from "../../approvals/types/approval.types";
import PaymentActions from "../components/PaymentActions";
import PaymentStatusBadge from "../components/PaymentStatusBadge";

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatPaymentMethod(value: string) {
  return value.replaceAll("_", " ");
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

        const response = await getPaymentById(id);
        setPayment(response);

        const [invoiceResponse, invoicePaymentResponse, approvalResponse] =
          await Promise.all([
            getInvoiceById(response.invoice_id),
            getPaymentsByInvoice(response.invoice_id),
            getApprovalInstancesByEntity(response.id),
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

  const invoiceCurrency = invoice?.currency ?? undefined;
  const invoiceTotal = Number(invoice?.total_amount ?? 0);
  const reservedTotal = getReservedPaymentTotal(invoicePayments);
  const balanceRemaining = Math.max(invoiceTotal - reservedTotal, 0);
  const hasPendingApproval =
    payment.status === "PENDING_APPROVAL" &&
    paymentApproval?.status === "PENDING";

  return (
    <div className="flex min-w-0 flex-col gap-6">
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

      <div className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <Link
            to="/payments"
            className="text-sm font-medium text-primary-blue hover:underline"
          >
            ← Back to Payments
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-primary-black">
            Payment for {payment.invoice_number ?? "Invoice"}
          </h1>

          <p className="mt-1 text-sm text-primary-gray">
            Supplier: {payment.supplier_name ?? "-"}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col lg:items-end">
          <PaymentStatusBadge status={payment.status} />

          <span className="text-sm text-primary-gray">
            Created {formatDate(payment.created_at)}
          </span>

          {hasPendingApproval ? (
            <div className="max-w-xs rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
              <p className="font-semibold">
                Payment submitted for approval and awaiting review.
              </p>

              {paymentApproval && (
                <Link
                  to={`/approvals/${paymentApproval.id}`}
                  className="mt-2 inline-flex font-semibold text-yellow-800 hover:underline"
                >
                  View Approval Request
                </Link>
              )}
            </div>
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
      <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Payment Amount</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(Number(payment.amount ?? 0), invoiceCurrency)}
          </p>
        </div>

        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-sm text-primary-gray">Invoice Total</p>
          <p className="mt-2 text-2xl font-semibold text-primary-black">
            {formatCurrency(invoiceTotal, invoiceCurrency)}
          </p>
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-yellow-700">Reserved/Paid</p>
          <p className="mt-2 text-2xl font-semibold text-yellow-800">
            {formatCurrency(reservedTotal, invoiceCurrency)}
          </p>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-red-700">Balance Remaining</p>
          <p className="mt-2 text-2xl font-semibold text-red-800">
            {formatCurrency(balanceRemaining, invoiceCurrency)}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
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
              {formatCurrency(Number(payment.amount ?? 0), invoiceCurrency)}
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
      </section>
    </div>
  );
}
