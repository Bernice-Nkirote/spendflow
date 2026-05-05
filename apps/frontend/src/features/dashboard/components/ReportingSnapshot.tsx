import type { ReportingSnapshot as ReportingSnapshotType } from "../types/dashboard.types";
import EmptyState from "../../../components/ui/EmptyState";

type ReportingSnapshotProps = {
  data: ReportingSnapshotType | undefined;
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

export default function ReportingSnapshot({ data }: ReportingSnapshotProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Reporting Snapshot
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Quick view of procurement reporting activity and available exports.
        </p>
      </div>

      {!data ? (
        <EmptyState message="No reporting snapshot available." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="text-sm font-medium text-gray-500">
                Reports Generated
              </p>
              <p className="mt-2 text-2xl font-semibold text-gray-900">
                {data.totalReportsGenerated}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="text-sm font-medium text-gray-500">
                Last Generated
              </p>
              <p className="mt-2 text-sm font-medium text-gray-900">
                {data.lastReportGeneratedAt
                  ? formatDateTime(data.lastReportGeneratedAt)
                  : "No reports generated yet"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">Export Formats</p>

            <div className="mt-2 flex flex-wrap gap-2">
              {data.exportFormatsAvailable.map((format) => (
                <span
                  key={format}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-gray-700"
                >
                  {format}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
