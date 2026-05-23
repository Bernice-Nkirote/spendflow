import StatusBadge from "../../../components/ui/StatusBadge";

import type { PurchaseOrderStatus } from "../types/purchaseOrder.types";

type Props = {
  status: PurchaseOrderStatus;
};

const statusVariantMap: Record<
  PurchaseOrderStatus,
  "neutral" | "warning" | "success" | "danger" | "info"
> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  SENT: "info",
  PARTIALLY_RECEIVED: "warning",
  RECEIVED: "success",
};

function formatStatus(status: PurchaseOrderStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PurchaseOrderStatusBadge({ status }: Props) {
  return (
    <StatusBadge variant={statusVariantMap[status]}>
      {formatStatus(status)}
    </StatusBadge>
  );
}
