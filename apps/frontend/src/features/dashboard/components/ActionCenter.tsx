import { Link } from "react-router-dom";
import type { DashboardActionCenter } from "../types/dashboard.types";
import DashboardIcon from "./DashboardIcon";

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
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <DashboardIcon name="action" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-primary-black">
              Action Center
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-gray">
              The work that needs attention across approvals, POs, invoices, and
              payments.
            </p>
          </div>
        </div>

        <Link
          to="/approvals"
          className="inline-flex w-fit shrink-0 items-center justify-center rounded-full border border-primary-blue/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary-blue shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-primary-blue hover:text-white hover:shadow-md"
        >
          View approvals
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {actionItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="dashboard-glass-card group rounded-2xl border p-4 transition hover:-translate-y-0.5 sm:p-5"
          >
            <div className="flex min-h-[112px] flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold leading-5 text-primary-black">
                    {item.label}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-primary-gray">
                    {item.helper}
                  </p>
                </div>

                <span
                  className={`flex h-11 min-w-11 shrink-0 items-center justify-center rounded-2xl px-3 text-base font-bold ring-1 ${toneClasses[item.tone]}`}
                >
                  {item.value}
                </span>
              </div>

              <span className="text-xs font-semibold text-primary-blue transition group-hover:translate-x-0.5">
                Open details
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
