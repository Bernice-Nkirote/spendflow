import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/formatCurrency";
import type { SpendSnapshot as SpendSnapshotData } from "../types/dashboard.types";
import DashboardIcon from "./DashboardIcon";

type SpendSnapshotProps = {
  data: SpendSnapshotData | undefined;
  currency: string | undefined;
};

export default function SpendSnapshot({ data, currency }: SpendSnapshotProps) {
  const metrics = [
    {
      label: "Month spend",
      value: formatCurrency(data?.monthToDateSpend ?? 0, currency ?? "KES"),
      helper: "Approved and active PO value this month",
      featured: true,
    },
    {
      label: "Average PO",
      value: formatCurrency(data?.averagePoValue ?? 0, currency ?? "KES"),
      helper: "Typical approved order value",
      featured: false,
    },
    {
      label: "Active suppliers",
      value: data?.activeSupplierCount ?? 0,
      helper: "Suppliers currently available",
      featured: false,
    },
    {
      label: "Top category",
      value: data?.topCategory ?? "Not set",
      helper: "Most common supplier category",
      featured: false,
    },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <DashboardIcon name="spend" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-primary-black">
              Spend Snapshot
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-gray">
              A quick view of current spend, supplier coverage, and procurement
              concentration.
            </p>
          </div>
        </div>

        <Link
          to="/reports"
          className="inline-flex w-fit shrink-0 items-center justify-center rounded-full border border-primary-blue/20 bg-primary-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-black hover:shadow-md"
        >
          Open reports
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`dashboard-glass-card rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5 ${
              metric.featured ? "md:col-span-2" : ""
            }`}
          >
            <div className="flex min-h-[132px] flex-col justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
                  {metric.label}
                </p>
                <p
                  className={`mt-3 break-words text-primary-black ${
                    metric.featured
                      ? "text-2xl font-bold sm:text-3xl"
                      : "text-xl font-semibold sm:text-2xl"
                  }`}
                >
                  {metric.value}
                </p>
              </div>

              <p className="text-sm leading-5 text-primary-gray">
                {metric.helper}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
