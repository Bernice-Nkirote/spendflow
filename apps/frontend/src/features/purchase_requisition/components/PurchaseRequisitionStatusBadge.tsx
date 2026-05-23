import StatusBadge from "../../../components/ui/StatusBadge";

import type { PurchaseRequisitionStatus } from "../types/purchaseRequisition.types";

type Props = {
  status: PurchaseRequisitionStatus;
};

const statusVariantMap: Record<
  PurchaseRequisitionStatus,
  "neutral" | "warning" | "success" | "danger" | "info"
> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  CONVERTED_TO_PO: "info",
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
    <StatusBadge variant={statusVariantMap[status]}>
      {formatStatus(status)}
    </StatusBadge>
  );
}
