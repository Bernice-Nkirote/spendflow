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
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-500">
          Overview of procurement activity, approvals, spending, and operational
          performance.
        </p>
      </section>

      {loading && <LoadingState message="Loading dashboard data..." />}

      {error && !loading && <ErrorState message={error} />}

      {!loading && !error && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Purchase Requisitions"
              value={data?.summary.totalPurchaseRequisitions ?? 0}
              description="Total requisitions created"
              accentColor="purple"
            />

            <SummaryCard
              title="Purchase Orders"
              value={data?.summary.totalPurchaseOrders ?? 0}
              description="Orders issued to suppliers"
              accentColor="red"
            />

            <SummaryCard
              title="Pending Approvals"
              value={data?.summary.pendingApprovals ?? 0}
              description="Items awaiting approval"
              accentColor="yellow"
            />

            <SummaryCard
              title="Total Spend"
              value={formatCurrency(
                data?.summary.totalSpend ?? 0,
                data?.currency,
              )}
              description="Approved procurement value"
              accentColor="green"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <WorkflowOverview data={data?.workflow} />
            </Card>

            <Card>
              <ApprovalQueue items={data?.approvalQueue} />
            </Card>
          </section>

          <section className="grid gap-6 xl:grid-cols-2">
            <Card>
              <RecentActivity items={data?.recentActivity} />
            </Card>

            <Card>
              <ReportingSnapshot data={data?.reportingSnapshot} />
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
