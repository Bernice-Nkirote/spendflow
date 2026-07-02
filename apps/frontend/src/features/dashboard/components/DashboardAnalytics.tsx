import type {
  DashboardActionCenter,
  SupplierScorecardItem,
} from "../types/dashboard.types";
import DashboardIcon from "./DashboardIcon";

type DashboardAnalyticsProps = {
  actionCenter: DashboardActionCenter | undefined;
  supplierScorecards: SupplierScorecardItem[] | undefined;
};

function clampPercent(value: number) {
  return Math.max(4, Math.min(value, 100));
}

export default function DashboardAnalytics({
  actionCenter,
  supplierScorecards,
}: DashboardAnalyticsProps) {
  const approvalItems = [
    {
      label: "PR",
      value: actionCenter?.pendingPrApprovals ?? 0,
      color: "bg-amber-500",
    },
    {
      label: "PO",
      value: actionCenter?.pendingPoApprovals ?? 0,
      color: "brand-gradient-accent",
    },
    {
      label: "Invoice",
      value: actionCenter?.pendingInvoiceApprovals ?? 0,
      color: "bg-emerald-600",
    },
    {
      label: "Payment",
      value: actionCenter?.pendingPaymentApprovals ?? 0,
      color: "bg-purple-700",
    },
  ];

  const maxApprovalValue = Math.max(...approvalItems.map((item) => item.value), 1);
  const topSuppliers = supplierScorecards?.slice(0, 5) ?? [];

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-3">
          <DashboardIcon name="analytics" />
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Procurement Analytics
            </h2>
            <p className="mt-1 text-sm leading-5 text-primary-gray">
              Visual signals for approval pressure and supplier performance.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="dashboard-glass-card rounded-2xl border p-5">
          <p className="text-sm font-semibold text-primary-black">
            Approval load
          </p>
          <p className="mt-1 text-xs leading-5 text-primary-gray">
            Where approval work is currently building up.
          </p>

          <div className="mt-5 space-y-4">
            {approvalItems.map((item) => {
              const width = clampPercent((item.value / maxApprovalValue) * 100);

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-primary-black">
                      {item.label}
                    </span>
                    <span className="font-medium text-primary-gray">
                      {item.value}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${item.color}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dashboard-glass-card rounded-2xl border p-5">
          <p className="text-sm font-semibold text-primary-black">
            Top supplier performance
          </p>
          <p className="mt-1 text-xs leading-5 text-primary-gray">
            Top 5 suppliers by activity and recorded performance.
          </p>

          <div className="mt-5 space-y-4">
            {topSuppliers.length === 0 ? (
              <p className="rounded-xl border border-dashed border-primary-blue/20 bg-white/45 p-4 text-sm text-primary-gray backdrop-blur">
                Supplier analytics will appear after suppliers receive POs.
              </p>
            ) : (
              topSuppliers.map((supplier) => (
                <div key={supplier.supplierId}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                    <span className="truncate font-semibold text-primary-black">
                      {supplier.supplierName}
                    </span>
                    <span className="font-medium text-primary-gray">
                      {supplier.performanceScore}%
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full brand-gradient-accent"
                      style={{
                        width: `${clampPercent(supplier.performanceScore)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
