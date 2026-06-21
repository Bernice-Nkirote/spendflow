import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/formatCurrency";
import type { SpendSnapshot as SpendSnapshotData } from "../types/dashboard.types";

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
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Spend Snapshot
          </h2>
          <p className="mt-1 text-sm leading-5 text-primary-gray">
            A quick view of current spend, supplier coverage, and procurement
            concentration.
          </p>
        </div>

        <Link
          to="/reports"
          className="inline-flex items-center justify-center rounded-full border border-primary-blue/20 bg-primary-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-black hover:shadow-md"
        >
          Open reports
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className={`rounded-2xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md ${
              metric.featured ? "lg:col-span-2" : ""
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              {metric.label}
            </p>
            <p
              className={`mt-3 text-primary-black ${
                metric.featured
                  ? "text-3xl font-bold sm:text-4xl"
                  : "text-2xl font-semibold"
              }`}
            >
              {metric.value}
            </p>
            <p className="mt-3 text-sm leading-5 text-primary-gray">
              {metric.helper}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
