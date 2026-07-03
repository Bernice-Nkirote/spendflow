import { useEffect, useState } from "react";
import { getDashboardData } from "../api/dashboardApi";
import type { DashboardData } from "../types/dashboard.types";
import Card from "../../../components/ui/Card";
import SummaryCard from "../components/SummaryCard";
import LoadingState from "../../../components/ui/LoadingState";
import ErrorState from "../../../components/ui/ErrorState";
import WorkflowOverview from "../components/WorkflowOverview";
import ApprovalQueue from "../components/ApprovalQueue";
import RecentActivity from "../components/RecentActivity";
import ReportingSnapshot from "../components/ReportingSnapshot";
import ActionCenter from "../components/ActionCenter";
import SpendSnapshot from "../components/SpendSnapshot";
import SupplierPerformance from "../components/SupplierPerformance";
import DashboardAnalytics from "../components/DashboardAnalytics";
import DashboardAssistantCard from "../components/DashboardAssistantCard";

type DashboardSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

type DashboardView =
  | "overview"
  | "spendSuppliers"
  | "operations"
  | "reportsActivity";

const dashboardViews: Array<{
  key: DashboardView;
  label: string;
  helper: string;
  accent: string;
  accentRgb: string;
}> = [
  {
    key: "overview",
    label: "At a Glance",
    helper: "Key totals and next actions",
    accent: "#26658C",
    accentRgb: "38, 101, 140",
  },
  {
    key: "spendSuppliers",
    label: "Spend & Suppliers",
    helper: "Spend patterns and supplier health",
    accent: "#17A398",
    accentRgb: "23, 163, 152",
  },
  {
    key: "operations",
    label: "Operational Details",
    helper: "Workflow and approval movement",
    accent: "#8EA604",
    accentRgb: "142, 166, 4",
  },
  {
    key: "reportsActivity",
    label: "Reports & Activity",
    helper: "Recent records and report signals",
    accent: "#925E78",
    accentRgb: "146, 94, 120",
  },
];

function formatCompactCurrency(value: number, currency = "KES") {
  const absValue = Math.abs(value);
  const units = [
    { suffix: "B", amount: 1_000_000_000 },
    { suffix: "M", amount: 1_000_000 },
    { suffix: "K", amount: 1_000 },
  ];
  const unit = units.find((item) => absValue >= item.amount);

  if (!unit) {
    return `${currency} ${value.toLocaleString("en-KE")}`;
  }

  const compactValue = value / unit.amount;
  const decimals = Math.abs(compactValue) < 10 && compactValue % 1 !== 0 ? 1 : 0;

  return `${currency} ${compactValue.toFixed(decimals)}${unit.suffix}`;
}

function DashboardSectionHeader({
  eyebrow,
  title,
  description,
}: DashboardSectionHeaderProps) {
  return (
    <div className="mb-4 max-w-3xl">
      {eyebrow && (
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#26658C]">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 text-lg font-semibold text-[#011C40]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-primary-gray">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<DashboardView>("overview");

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);

        const result = await getDashboardData();
        setData(result);
      } catch (err: any) {
        setError(err?.response?.data?.detail || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  function handleViewChange(view: DashboardView) {
    setActiveView(view);

    window.setTimeout(() => {
      document.getElementById("dashboard-detail-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  return (
    <div className="space-y-8">
      <section className="glass-panel-strong overflow-hidden rounded-3xl border p-5 sm:p-6">
        <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-[#26658C]">
              Tendaflow Command Center
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#011C40] sm:text-3xl">
              Start with what needs attention.
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-primary-gray">
              A calmer view of approvals, procurement movement, supplier
              performance, and spend signals so teams can decide what to do next.
            </p>
          </div>

          <DashboardAssistantCard />
        </div>
      </section>

      <section className="dashboard-glass-card rounded-2xl border px-3 py-2 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
          {dashboardViews.map((view) => {
            const isActive = activeView === view.key;

            return (
              <button
                key={view.key}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleViewChange(view.key)}
                style={{
                  borderColor: isActive
                    ? `rgba(${view.accentRgb}, 0.42)`
                    : "rgba(167, 235, 242, 0.34)",
                  background: isActive
                    ? `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(${view.accentRgb},0.14))`
                    : "linear-gradient(145deg, rgba(255,255,255,0.78), rgba(255,255,255,0.58))",
                  boxShadow: isActive
                    ? `0 14px 30px rgba(${view.accentRgb}, 0.16), inset 0 1px 0 rgba(255,255,255,0.78)`
                    : undefined,
                }}
                className={`group min-w-[12.5rem] rounded-xl border px-3.5 py-2.5 text-left backdrop-blur-xl transition-all duration-200 sm:min-w-0 ${
                  isActive
                    ? "text-[#011C40]"
                    : "text-[#26658C] hover:-translate-y-0.5 hover:border-[#54ACBF]/55 hover:bg-white/80 hover:text-[#011C40] hover:shadow-md"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    style={{ backgroundColor: `rgba(${view.accentRgb}, 0.14)` }}
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white/70"
                  />
                  <span className="truncate text-sm font-semibold">
                    {view.label}
                  </span>
                </span>
                <span className="mt-1 hidden truncate text-xs text-primary-gray sm:block">
                  {view.helper}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {loading && <LoadingState message="Loading dashboard data..." />}

      {error && !loading && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <section>
            <DashboardSectionHeader
              eyebrow="At a glance"
              title="Your procurement snapshot"
              description="Current requisitions, orders, approval load, and approved spend in one clear view. Use the dashboard buttons above when you need more detail."
            />
            <div className="grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Purchase requisitions"
                value={data?.summary.totalPurchaseRequisitions ?? 0}
                description="Total requisitions created"
                accentColor="blue"
              />

              <SummaryCard
                title="Purchase orders"
                value={data?.summary.totalPurchaseOrders ?? 0}
                description="Orders issued to suppliers"
                accentColor="purple"
              />

              <SummaryCard
                title="My pending approvals"
                value={data?.summary.pendingApprovals ?? 0}
                description="Items currently waiting for you"
                accentColor="yellow"
              />

              <SummaryCard
                title="Total approved spend"
                value={formatCompactCurrency(
                  data?.summary.totalSpend ?? 0,
                  data?.currency,
                )}
                description="Approved procurement value"
                accentColor="green"
              />
            </div>
          </section>

          <div id="dashboard-detail-section" className="scroll-mt-28">
            {activeView === "overview" && (
              <section>
                <DashboardSectionHeader
                  eyebrow="Priority view"
                  title="What needs attention now"
                  description="A focused starting point for actions users may need to take next."
                />
                <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
                  <Card className="p-5 sm:p-6">
                    <ActionCenter data={data?.actionCenter} />
                  </Card>

                  <Card className="p-5 sm:p-6">
                    <DashboardAnalytics
                      actionCenter={data?.actionCenter}
                      supplierScorecards={data?.supplierScorecards}
                    />
                  </Card>
                </div>
              </section>
            )}

            {activeView === "spendSuppliers" && (
              <section>
                <DashboardSectionHeader
                  eyebrow="Spend and suppliers"
                  title="Money movement and supplier health"
                  description="A focused view of spend patterns and the top suppliers users may need to review."
                />
                <div className="grid gap-6 2xl:grid-cols-[0.95fr_1.05fr]">
                  <Card className="p-5 sm:p-6">
                    <SpendSnapshot
                      data={data?.spendSnapshot}
                      currency={data?.currency}
                    />
                  </Card>

                  <Card className="p-5 sm:p-6">
                    <SupplierPerformance
                      items={data?.supplierScorecards}
                      currency={data?.currency}
                    />
                  </Card>
                </div>
              </section>
            )}

            {activeView === "operations" && (
              <section>
                <DashboardSectionHeader
                  eyebrow="Operational details"
                  title="Workflow and approval movement"
                  description="Workflow movement and pending approval queue for deeper operational context."
                />
                <div className="grid gap-6 2xl:grid-cols-[1fr_1fr]">
                  <Card className="p-5 sm:p-6">
                    <WorkflowOverview data={data?.workflow} />
                  </Card>

                  <Card className="p-5 sm:p-6">
                    <ApprovalQueue items={data?.approvalQueue} />
                  </Card>
                </div>
              </section>
            )}

            {activeView === "reportsActivity" && (
              <section>
                <DashboardSectionHeader
                  eyebrow="Reports and activity"
                  title="Recent records and reporting signals"
                  description="Recent system activity and reporting totals for users who need to review what has changed."
                />
                <div className="grid items-start gap-6 2xl:grid-cols-[1fr_1fr]">
                  <Card className="p-5 sm:p-6">
                    <RecentActivity items={data?.recentActivity} />
                  </Card>

                  <Card className="p-5 sm:p-6">
                    <ReportingSnapshot data={data?.reportingSnapshot} />
                  </Card>
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}