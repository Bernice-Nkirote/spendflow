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
    },
    {
      label: "Average PO",
      value: formatCurrency(data?.averagePoValue ?? 0, currency ?? "KES"),
      helper: "Typical approved order value",
    },
    {
      label: "Active suppliers",
      value: data?.activeSupplierCount ?? 0,
      helper: "Suppliers currently available",
    },
    {
      label: "Top category",
      value: data?.topCategory ?? "Not set",
      helper: "Most common supplier category",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
          className="text-sm font-semibold text-primary-blue transition hover:text-primary-black"
        >
          Open reports
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-gray-200 bg-gradient-to-br from-white to-blue-50/40 p-4 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-gray">
              {metric.label}
            </p>
            <p className="mt-2 truncate text-xl font-semibold text-primary-black">
              {metric.value}
            </p>
            <p className="mt-2 text-xs leading-5 text-primary-gray">
              {metric.helper}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
