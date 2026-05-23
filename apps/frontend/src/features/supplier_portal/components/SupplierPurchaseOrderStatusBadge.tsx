import StatusBadge from "../../../components/ui/StatusBadge";
import { formatSupplierEnum } from "../utils/formatSupplierEnum";

type Props = {
  status: string;
};

function getVariant(status: string) {
  if (["APPROVED", "SENT", "RECEIVED", "CLOSED"].includes(status)) {
    return "success";
  }

  if (["PENDING_APPROVAL", "PARTIALLY_RECEIVED"].includes(status)) {
    return "warning";
  }

  if (["REJECTED", "CANCELLED"].includes(status)) return "danger";
  if (["DRAFT"].includes(status)) return "neutral";

  return "info";
}

function SupplierPurchaseOrderStatusBadge({ status }: Props) {
  return (
    <StatusBadge variant={getVariant(status)}>
      {formatSupplierEnum(status)}
    </StatusBadge>
  );
}

export default SupplierPurchaseOrderStatusBadge;
