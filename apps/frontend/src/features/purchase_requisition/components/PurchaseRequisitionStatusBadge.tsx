import type { PurchaseRequisitionStatus } from "../types/purchaseRequisition.types";

type Props = {
  status: PurchaseRequisitionStatus;
};

const statusStyles: Record<PurchaseRequisitionStatus, string> = {
  DRAFT: "bg-gray-50 text-gray-700 ring-gray-600/20",
  PENDING_APPROVAL: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  APPROVED: "bg-green-50 text-green-700 ring-green-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
  CANCELLED: "bg-gray-100 text-gray-600 ring-gray-500/20",
  CONVERTED_TO_PO: "bg-blue-50 text-blue-700 ring-blue-600/20",
};

function formatStatus(status: PurchaseRequisitionStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PurchaseRequisitionStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex w-fit whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ring-1 ${statusStyles[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}
