import type { RecentActivityItem } from "../types/dashboard.types";
import EmptyState from "../../../components/ui/EmptyState";
import DashboardIcon from "./DashboardIcon";

type RecentActivityProps = {
  items: RecentActivityItem[] | undefined;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <DashboardIcon name="activity" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-primary-black">
            Recent Activity
          </h2>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-gray">
            Latest procurement, approval, and operational activity across the
            platform.
          </p>
        </div>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState message="No recent activity recorded yet." />
      ) : (
        <div className="space-y-4">
          {items.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="dashboard-glass-card flex items-start gap-4 rounded-xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
            >
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/50 shadow-inner">
                <div className="h-2.5 w-2.5 rounded-full brand-gradient-accent" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold leading-5 text-primary-black">
                      {activity.action}
                    </p>

                    <p className="mt-1 break-words text-xs leading-5 text-primary-gray">
                      {activity.entityType}
                      {activity.entityReference
                        ? ` / ${activity.entityReference}`
                        : ""}
                    </p>
                  </div>

                  <p className="shrink-0 rounded-full bg-white/45 px-3 py-1 text-xs font-medium text-primary-gray shadow-inner">
                    {formatDateTime(activity.createdAt)}
                  </p>
                </div>

                <p className="mt-3 text-xs leading-5 text-primary-gray">
                  Performed by{" "}
                  <span className="font-medium text-primary-black">
                    {activity.performedBy ?? "System"}
                  </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
