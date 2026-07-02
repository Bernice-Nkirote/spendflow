import { Link } from "react-router-dom";
import EmptyState from "../../../components/ui/EmptyState";
import StatusBadge from "../../../components/ui/StatusBadge";
import type { ApprovalQueueItem } from "../types/dashboard.types";
import DashboardIcon from "./DashboardIcon";

type ApprovalQueueProps = {
  items: ApprovalQueueItem[] | undefined;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ApprovalQueue({ items }: ApprovalQueueProps) {
  const visibleItems = items?.slice(0, 5) ?? [];

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-start gap-3">
          <DashboardIcon name="approval" />
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Approval Queue
            </h2>
            <p className="mt-1 text-sm leading-5 text-primary-gray">
              Documents currently requiring approval action.
            </p>
          </div>
        </div>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState message="No pending approvals." />
      ) : (
        <div className="space-y-3">
          {visibleItems.map((item) => (
            <Link
              key={item.id}
              to={`/approvals/${item.id}`}
              state={{ from: "dashboard" }}
              className="dashboard-glass-card block rounded-2xl border p-4 transition hover:-translate-y-0.5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary-blue">
                    {item.documentReference}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-gray">
                    {item.documentType}
                  </p>
                </div>

                <StatusBadge variant="warning">{item.status}</StatusBadge>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-primary-gray sm:grid-cols-2">
                <p>
                  Requested by{" "}
                  <span className="font-medium text-primary-black">
                    {item.requestedBy ?? "Unknown user"}
                  </span>
                </p>
                <p className="sm:text-right">{formatDate(item.createdAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
