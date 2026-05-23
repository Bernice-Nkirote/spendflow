import StatusBadge from "../../../components/ui/StatusBadge";
import { formatSupplierEnum } from "../utils/formatSupplierEnum";

type Props = {
  status: string;
};

function getVariant(status: string) {
  if (["APPROVED", "PAID", "COMPLETED"].includes(status)) return "success";
  if (["PENDING_APPROVAL", "PARTIALLY_PAID"].includes(status)) return "warning";
  if (["REJECTED", "CANCELLED"].includes(status)) return "danger";
  if (["DRAFT"].includes(status)) return "neutral";

  return "info";
}

function SupplierInvoiceStatusBadge({ status }: Props) {
  return (
    <StatusBadge variant={getVariant(status)}>
      {formatSupplierEnum(status)}
    </StatusBadge>
  );
}

export default SupplierInvoiceStatusBadge;
