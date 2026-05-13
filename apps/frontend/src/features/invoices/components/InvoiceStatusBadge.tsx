import type { InvoiceStatus } from "../types/invoice.types";

type Props = {
  status: InvoiceStatus;
};

const statusStyles: Record<InvoiceStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",

  PENDING_APPROVAL: "bg-yellow-50 text-yellow-700 border-yellow-200",

  APPROVED: "bg-green-50 text-green-700 border-green-200",

  REJECTED: "bg-red-50 text-red-700 border-red-200",

  CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",

  SENT: "bg-blue-50 text-blue-700 border-blue-200",

  PARTIALLY_PAID: "bg-orange-50 text-orange-700 border-orange-200",

  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function formatStatus(status: InvoiceStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function InvoiceStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex w-fit items-center whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
