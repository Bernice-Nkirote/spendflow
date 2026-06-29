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
import { formatCurrency } from "../../../utils/formatCurrency";

type DashboardSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
};

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

      {loading && <LoadingState message="Loading dashboard data..." />}

      {error && !loading && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <section>
            <DashboardSectionHeader
              eyebrow="At a glance"
              title="Your procurement snapshot"
              description="Current requisitions, orders, approval load, and approved spend in one clear view."
            />
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
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
                value={formatCurrency(
                  data?.summary.totalSpend ?? 0,
                  data?.currency,
                )}
                description="Approved procurement value"
                accentColor="green"
              />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="p-5 sm:p-6">
              <ActionCenter data={data?.actionCenter} />
            </Card>

            <Card className="p-5 sm:p-6">
              <DashboardAnalytics
                actionCenter={data?.actionCenter}
                supplierScorecards={data?.supplierScorecards}
              />
            </Card>
          </section>

          <section>
            <DashboardSectionHeader
              eyebrow="Spend and suppliers"
              title="Money movement and supplier health"
              description="A focused view of spend patterns and the top suppliers users may need to review."
            />
            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
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

          <section>
            <DashboardSectionHeader
              eyebrow="Operational details"
              title="Deeper activity when users need context"
              description="Workflow movement, pending queue, recent activity, and reporting signals for deeper context."
            />
            <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
              <Card className="p-5 sm:p-6">
                <WorkflowOverview data={data?.workflow} />
              </Card>

              <Card className="p-5 sm:p-6">
                <ApprovalQueue items={data?.approvalQueue} />
              </Card>
            </div>
          </section>

          <section className="grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="p-5 sm:p-6">
              <RecentActivity items={data?.recentActivity} />
            </Card>

            <Card className="p-5 sm:p-6">
              <ReportingSnapshot data={data?.reportingSnapshot} />
            </Card>
          </section>
        </>
      )}
    </div>
  );
}