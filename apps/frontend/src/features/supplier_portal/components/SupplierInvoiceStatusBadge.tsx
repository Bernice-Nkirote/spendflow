import { formatSupplierEnum } from "../utils/formatSupplierEnum";

type Props = {
  status: string;
};

function SupplierInvoiceStatusBadge({ status }: Props) {
  const statusStyles: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING_APPROVAL: "bg-yellow-50 text-yellow-700",
    APPROVED: "bg-green-50 text-green-700",
    REJECTED: "bg-red-50 text-red-700",
    PARTIALLY_PAID: "bg-blue-50 text-blue-700",
    PAID: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-200 text-gray-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${
        statusStyles[status] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {formatSupplierEnum(status)}
    </span>
  );
}

export default SupplierInvoiceStatusBadge;
