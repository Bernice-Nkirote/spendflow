import StatusBadge from "../../../components/ui/StatusBadge";
import type { ApprovalStatus } from "../types/approval.types";

type ApprovalStatusBadgeProps = {
  status: ApprovalStatus;
};

function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  const variantMap: Record<ApprovalStatus, "warning" | "success" | "danger"> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
  };

  return (
    <StatusBadge variant={variantMap[status]}>
      {status.replace("_", " ")}
    </StatusBadge>
  );
}

export default ApprovalStatusBadge;
