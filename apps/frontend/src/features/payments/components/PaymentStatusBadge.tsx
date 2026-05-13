import type { PaymentStatus } from "../types/payment.types";

const statusStyles: Record<PaymentStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700 border-gray-200",
  PENDING_APPROVAL: "bg-yellow-50 text-yellow-700 border-yellow-200",
  COMPLETED: "bg-green-50 text-green-700 border-green-200",
  REJECTED: "bg-red-50 text-red-700 border-red-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

function formatStatus(status: PaymentStatus) {
  return status.replaceAll("_", " ");
}

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
};

export default function PaymentStatusBadge({
  status,
}: PaymentStatusBadgeProps) {
  return (
    <span
      className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
