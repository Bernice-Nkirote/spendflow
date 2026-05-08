import type { ApprovalStatus } from "../types/approval.types";

type ApprovalStatusBadgeProps = {
  status: ApprovalStatus;
};

function ApprovalStatusBadge({ status }: ApprovalStatusBadgeProps) {
  const styles: Record<ApprovalStatus, string> = {
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    APPROVED: "bg-green-100 text-green-800 border-green-200",
    REJECTED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

export default ApprovalStatusBadge;
