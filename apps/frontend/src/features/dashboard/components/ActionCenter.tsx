import { Link } from "react-router-dom";
import type { DashboardActionCenter } from "../types/dashboard.types";

type ActionCenterProps = {
  data: DashboardActionCenter | undefined;
};

type ActionItem = {
  label: string;
  value: number;
  helper: string;
  to: string;
  tone: "blue" | "amber" | "green";
};

const toneClasses: Record<ActionItem["tone"], string> = {
  blue: "bg-blue-50 text-primary-blue ring-blue-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export default function ActionCenter({ data }: ActionCenterProps) {
  const actionItems: ActionItem[] = [
    {
      label: "PR approvals",
      value: data?.pendingPrApprovals ?? 0,
      helper: "Requisitions waiting for a decision",
      to: "/approvals",
      tone: "amber",
    },
    {
      label: "PO approvals",
      value: data?.pendingPoApprovals ?? 0,
      helper: "Orders waiting before supplier action",
      to: "/approvals",
      tone: "amber",
    },
    {
      label: "Invoices",
      value: data?.pendingInvoiceApprovals ?? 0,
      helper: "Invoices waiting for review",
      to: "/approvals",
      tone: "blue",
    },
    {
      label: "Payments",
      value: data?.pendingPaymentApprovals ?? 0,
      helper: "Payments waiting for approval",
      to: "/approvals",
      tone: "blue",
    },
    {
      label: "PRs ready for PO",
      value: data?.approvedPrsAwaitingPo ?? 0,
      helper: "Approved requisitions to convert",
      to: "/purchase-requisitions",
      tone: "green",
    },
    {
      label: "Invoices to pay",
      value: data?.approvedInvoicesAwaitingPayment ?? 0,
      helper: "Approved invoices awaiting payment",
      to: "/invoices",
      tone: "green",
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Action Center
          </h2>
          <p className="mt-1 text-sm leading-5 text-primary-gray">
            The work that needs attention across approvals, POs, invoices, and
            payments.
          </p>
        </div>

        <Link
          to="/approvals"
          className="text-sm font-semibold text-primary-blue transition hover:text-primary-black"
        >
          View approvals
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {actionItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-blue/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary-black">
                  {item.label}
                </p>
                <p className="mt-1 text-xs leading-5 text-primary-gray">
                  {item.helper}
                </p>
              </div>

              <span
                className={`flex h-10 min-w-10 shrink-0 items-center justify-center rounded-full px-3 text-sm font-bold ring-1 ${toneClasses[item.tone]}`}
              >
                {item.value}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
