import type { ProcurementWorkflowSummary } from "../types/dashboard.types";

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
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-primary-black">
          Procurement Workflow Overview
        </h2>
        <p className="mt-1 text-sm leading-5 text-primary-gray">
          High-level view of documents moving through the procurement lifecycle.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {workflowItems.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md"
          >
            <p className="text-sm font-medium text-primary-gray">
              {item.shortLabel}
            </p>

            <p className="mt-2 text-2xl font-semibold text-primary-black">
              {item.value}
            </p>

            <p className="mt-1 text-xs text-primary-gray">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
