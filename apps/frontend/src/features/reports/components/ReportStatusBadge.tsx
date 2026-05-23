import StatusBadge from "../../../components/ui/StatusBadge";

type Props = {
  status: string | null | undefined;
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusVariant(status: string) {
  switch (status) {
    case "APPROVED":
    case "PAID":
    case "COMPLETED":
    case "SENT":
    case "CONVERTED_TO_PO":
      return "success";

    case "PENDING":
    case "PENDING_APPROVAL":
    case "PARTIALLY_PAID":
    case "DRAFT":
      return "warning";

    case "REJECTED":
    case "CANCELLED":
    case "FAILED":
      return "danger";

    case "ISSUED":
    case "ACTIVE":
      return "info";

    default:
      return "neutral";
  }
}

export default function ReportStatusBadge({ status }: Props) {
  const normalizedStatus = status || "UNKNOWN";

  return (
    <StatusBadge variant={getStatusVariant(normalizedStatus)}>
      {formatStatus(normalizedStatus)}
    </StatusBadge>
  );
}
