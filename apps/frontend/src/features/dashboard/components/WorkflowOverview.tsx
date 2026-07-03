import type { ProcurementWorkflowSummary } from "../types/dashboard.types";
import DashboardIcon from "./DashboardIcon";

type WorkflowOverviewProps = {
  data: ProcurementWorkflowSummary | undefined;
};

export default function WorkflowOverview({ data }: WorkflowOverviewProps) {
  const workflowItems = [
    {
      label: "Purchase Requisitions",
      shortLabel: "PRs",
      value: data?.purchaseRequisitions ?? 0,
    },
    {
      label: "Purchase Orders",
      shortLabel: "POs",
      value: data?.purchaseOrders ?? 0,
    },
    {
      label: "Invoices",
      shortLabel: "Invoices",
      value: data?.invoices ?? 0,
    },
    {
      label: "Payments",
      shortLabel: "Payments",
      value: data?.payments ?? 0,
    },
  ];

  return (
    <div>
      <div className="mb-5 flex items-start gap-3">
        <DashboardIcon name="workflow" />
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-primary-black">
            Procurement Workflow Overview
          </h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-gray">
            High-level view of documents moving through the procurement lifecycle.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workflowItems.map((item) => (
          <div
            key={item.label}
            className="dashboard-glass-card rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
          >
            <div className="flex min-h-[118px] flex-col justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-primary-gray">
                  {item.shortLabel}
                </p>

                <p className="mt-2 break-words text-3xl font-semibold text-primary-black">
                  {item.value}
                </p>
              </div>

              <p className="text-xs leading-5 text-primary-gray">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
