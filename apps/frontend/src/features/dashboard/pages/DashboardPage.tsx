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
import { formatCurrency } from "../../../utils/formatCurrency";

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
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary-blue">
              Tendaflow Command Center
            </p>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-primary-black sm:text-3xl">
              Know what needs attention.
            </h1>

            <p className="mt-3 text-sm leading-6 text-primary-gray">
              Track approvals, procurement movement, supplier performance, and
              spend signals from one calm workspace.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-blue">
              Today's focus
            </p>
            <p className="mt-2 text-3xl font-bold text-primary-black">
              {data?.summary.pendingApprovals ?? 0}
            </p>
            <p className="mt-1 text-sm leading-5 text-primary-gray">
              items need your approval or review. Start with the Action Center
              below.
            </p>
          </div>
        </div>
      </section>

      {loading && <LoadingState message="Loading dashboard data..." />}

      {error && !loading && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
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
          </section>

          <Card className="shadow-md">
            <ActionCenter data={data?.actionCenter} />
          </Card>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card className="shadow-md">
              <WorkflowOverview data={data?.workflow} />
            </Card>

            <Card className="shadow-md">
              <SpendSnapshot
                data={data?.spendSnapshot}
                currency={data?.currency}
              />
            </Card>
          </section>

          <Card className="shadow-md">
            <SupplierPerformance
              items={data?.supplierScorecards}
              currency={data?.currency}
            />
          </Card>

          <section className="grid items-start gap-6 xl:grid-cols-[1fr_1fr]">
            <Card className="shadow-md">
              <ApprovalQueue items={data?.approvalQueue} />
            </Card>

            <Card className="shadow-md">
              <RecentActivity items={data?.recentActivity} />
            </Card>
          </section>

          <section>
            <Card className="shadow-md">
              <ReportingSnapshot data={data?.reportingSnapshot} />
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
