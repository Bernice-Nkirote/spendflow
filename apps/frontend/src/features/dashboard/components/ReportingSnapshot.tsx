import { Link } from "react-router-dom";
import type { ReportingSnapshot as ReportingSnapshotType } from "../types/dashboard.types";
import EmptyState from "../../../components/ui/EmptyState";

type ReportingSnapshotProps = {
  data: ReportingSnapshotType | undefined;
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-KE", {
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Reporting Snapshot
          </h2>

          <p className="mt-1 text-sm leading-5 text-primary-gray">
            Quick view of report activity and available export formats.
          </p>
        </div>

        <Link
          to="/reports"
          className="inline-flex items-center justify-center rounded-full border border-primary-blue/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary-blue shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-primary-blue hover:text-white hover:shadow-md"
        >
          View reports
        </Link>
      </div>

      {!data ? (
        <EmptyState message="No reporting snapshot available." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-medium text-primary-gray">
                Reports Generated
              </p>

              <p className="mt-2 text-2xl font-semibold text-primary-black">
                {data.totalReportsGenerated}
              </p>
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
              <p className="text-sm font-medium text-primary-gray">
                Last Generated
              </p>

              <p className="mt-2 text-sm font-semibold text-primary-black">
                {data.lastReportGeneratedAt
                  ? formatDateTime(data.lastReportGeneratedAt)
                  : "No reports generated yet"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur">
            <p className="text-sm font-medium text-primary-gray">
              Export Formats
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {data.exportFormatsAvailable.map((format) => (
                <span
                  key={format}
                  className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-blue"
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
