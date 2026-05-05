type Props = {
  status: string;
};

const statusStyles: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700 border-gray-200",
  PENDING_APPROVAL: "bg-yellow-100 text-yellow-800 border-yellow-200",
  APPROVED: "bg-green-100 text-green-700 border-green-200",
  REJECTED: "bg-red-100 text-red-700 border-red-200",
  CANCELLED: "bg-gray-200 text-gray-700 border-gray-300",
  CONVERTED_TO_PO: "bg-blue-100 text-blue-700 border-blue-200",
};

function formatStatus(status: string) {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function ReportStatusBadge({ status }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
        statusStyles[status] ?? "bg-gray-100 text-gray-700 border-gray-200"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}
