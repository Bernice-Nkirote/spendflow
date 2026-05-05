import type { RecentActivityItem } from "../types/dashboard.types";
import EmptyState from "../../../components/ui/EmptyState";

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
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        <p className="mt-1 text-sm text-gray-500">
          Latest procurement and workflow actions.
        </p>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState message="No recent activity recorded yet." />
      ) : (
        <div className="space-y-3">
          {items.slice(0, 5).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/40 p-4 transition hover:bg-gray-50"
            >
              <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-600" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {activity.action}
                </p>

                <p className="mt-1 truncate text-xs text-gray-500">
                  {activity.entityType}
                  {activity.entityReference
                    ? ` • ${activity.entityReference}`
                    : ""}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  {activity.performedBy ?? "System"} •{" "}
                  {formatDateTime(activity.createdAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
