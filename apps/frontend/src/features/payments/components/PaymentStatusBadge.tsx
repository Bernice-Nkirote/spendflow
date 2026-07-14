import StatusBadge from "../../../components/ui/StatusBadge";

import type { PaymentStatus } from "../types/payment.types";

type Props = {
  status: PaymentStatus;
};

const statusVariantMap: Record<
  PaymentStatus,
  "neutral" | "warning" | "success" | "danger" | "info"
> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "info",
  COMPLETED: "success",
  REJECTED: "danger",
  FAILED: "danger",
};

function formatStatus(status: PaymentStatus) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function PaymentStatusBadge({ status }: Props) {
  return (
    <StatusBadge variant={statusVariantMap[status]}>
      {formatStatus(status)}
    </StatusBadge>
  );
}
