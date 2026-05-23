import StatusBadge from "../../../components/ui/StatusBadge";

import type { InvoiceStatus } from "../types/invoice.types";

type Props = {
  status: InvoiceStatus;
};

const statusVariantMap: Record<
  InvoiceStatus,
  "neutral" | "warning" | "success" | "danger" | "info"
> = {
  DRAFT: "neutral",
  PENDING_APPROVAL: "warning",
  APPROVED: "success",
  SENT: "info",
  PARTIALLY_PAID: "warning",
  PAID: "success",
  CANCELLED: "neutral",
  REJECTED: "danger",
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
    <StatusBadge variant={statusVariantMap[status]}>
      {formatStatus(status)}
    </StatusBadge>
  );
}
