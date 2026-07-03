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
      <div className="mb-5">
        <div className="flex items-start gap-3">
          <DashboardIcon name="approval" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-primary-black">
              Approval Queue
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-gray">
              Documents currently requiring approval action.
            </p>
          </div>
        </div>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState message="No pending approvals." />
      ) : (
        <div className="space-y-4">
          {visibleItems.map((item) => (
            <Link
              key={item.id}
              to={`/approvals/${item.id}`}
              state={{ from: "dashboard" }}
              className="dashboard-glass-card block rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-5 text-primary-blue">
                      {item.documentReference}
                    </p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-primary-gray">
                      {item.documentType}
                    </p>
                  </div>

                  <StatusBadge variant="warning">{item.status}</StatusBadge>
                </div>

                <div className="grid gap-3 text-xs text-primary-gray sm:grid-cols-2">
                  <div className="rounded-xl border border-white/60 bg-white/45 p-3 shadow-inner backdrop-blur">
                    <p className="font-semibold uppercase tracking-wide text-primary-gray">
                      Requested by
                    </p>
                    <p className="mt-1 break-words font-medium text-primary-black">
                      {item.requestedBy ?? "Unknown user"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/60 bg-white/45 p-3 shadow-inner backdrop-blur sm:text-right">
                    <p className="font-semibold uppercase tracking-wide text-primary-gray">
                      Created
                    </p>
                    <p className="mt-1 font-medium text-primary-black">
                      {formatDate(item.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
