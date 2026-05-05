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
        <h2 className="text-lg font-semibold text-gray-900">
          Procurement Workflow Overview
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          High-level view of procurement documents moving through the system.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {workflowItems.map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-gray-200 bg-gray-50/50 p-4"
          >
            <p className="text-sm font-medium text-gray-500">
              {item.shortLabel}
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-gray-400">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
