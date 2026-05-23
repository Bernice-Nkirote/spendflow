import type { PaymentListItem } from "../types/payment.types";

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatPaymentMethod(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getReservedPaymentTotal(
  invoiceId: string,
  payments: PaymentListItem[],
) {
  return payments
    .filter(
      (payment) =>
        payment.invoice_id === invoiceId &&
        (payment.status === "PENDING_APPROVAL" ||
          payment.status === "COMPLETED"),
    )
    .reduce((total, payment) => total + Number(payment.amount ?? 0), 0);
}

export function getPendingPaymentForInvoice(
  invoiceId: string,
  payments: PaymentListItem[],
) {
  return payments.find(
    (payment) =>
      payment.invoice_id === invoiceId && payment.status === "PENDING_APPROVAL",
  );
}
