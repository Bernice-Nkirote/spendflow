import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";
import TableWrapper from "../../../components/ui/TableWrapper";
import { formatCurrency } from "../../../utils/formatCurrency";
import {
  getPaginatedApprovalInstances,
  getMyPendingApprovalQueue,
} from "../api/approvalApi";
import ApprovalStatusBadge from "../components/ApprovalStatusBadge";
import type { ApprovalInstance } from "../types/approval.types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function ApprovalQueuePage() {
  const navigate = useNavigate();

  const [pendingInstances, setPendingInstances] = useState<ApprovalInstance[]>(
    [],
  );
  const [pendingTotalCount, setPendingTotalCount] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(5);
  const [isPendingLoading, setIsPendingLoading] = useState(true);

  const [historyInstances, setHistoryInstances] = useState<ApprovalInstance[]>(
    [],
  );
  const [historyTotalCount, setHistoryTotalCount] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);

  const [error, setError] = useState("");

  useEffect(() => {
    async function loadPendingApprovals() {
      try {
        setIsPendingLoading(true);
        setError("");

        const data = await getMyPendingApprovalQueue({
          page: pendingPage,
          pageSize: pendingPageSize,
        });

        setPendingInstances(data.rows);
        setPendingTotalCount(data.total_count);
      } catch (err) {
        console.error(err);
        setError("Failed to load pending approvals.");
      } finally {
        setIsPendingLoading(false);
      }
    }

    loadPendingApprovals();
  }, [pendingPage, pendingPageSize]);

  useEffect(() => {
    async function loadApprovalHistory() {
      try {
        setIsHistoryLoading(true);
        setError("");

        const data = await getPaginatedApprovalInstances({
          page: historyPage,
          pageSize: historyPageSize,
          excludeStatus: "PENDING",
        });

        setHistoryInstances(data.rows);
        setHistoryTotalCount(data.total_count);
      } catch (err) {
        console.error(err);
        setError("Failed to load approval history.");
      } finally {
        setIsHistoryLoading(false);
      }
    }

    loadApprovalHistory();
  }, [historyPage, historyPageSize]);

  function handlePendingPageSizeChange(pageSize: number) {
    setPendingPageSize(pageSize);
    setPendingPage(1);
  }

  function handleHistoryPageSizeChange(pageSize: number) {
    setHistoryPageSize(pageSize);
    setHistoryPage(1);
  }

  function openApproval(instanceId: string) {
    navigate(`/approvals/${instanceId}`);
  }

  function renderApprovalTable(
    instances: ApprovalInstance[],
    actionLabel: string,
    actionVariant: "primary" | "secondary",
    showLastComment = false,
  ) {
    return (
      <TableWrapper minWidth="1100px">
        <table className="w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Entity Type
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Reference
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Requester
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Amount
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Status
              </th>
              {showLastComment ? (
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                  Last Comment
                </th>
              ) : (
                <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                  Created
                </th>
              )}
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {instances.map((instance) => {
              const lastAction =
                instance.actions?.[instance.actions.length - 1];

              return (
                <tr key={instance.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                    {instance.entity_type}
                  </td>

                  <td className="px-4 py-3 font-medium text-primary-black">
                    {instance.entity_reference || "Not available"}
                  </td>

                  <td className="px-4 py-3 text-primary-gray">
                    {instance.requester_name || "Not available"}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-primary-black">
                    {formatCurrency(
                      Number(instance.total_amount ?? 0),
                      instance.currency || "KES",
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3">
                    <ApprovalStatusBadge status={instance.status} />
                  </td>

                  <td className="max-w-md px-4 py-3 text-primary-gray">
                    {showLastComment
                      ? lastAction?.comment || "No comment provided."
                      : formatDate(instance.created_at)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant={actionVariant}
                      size="sm"
                      onClick={() => openApproval(instance.id)}
                    >
                      {actionLabel}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrapper>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Approvals"
        description="Review pending procurement approvals and track completed approval decisions."
      />

      {error && <ErrorState message={error} />}

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Pending Approval Queue
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Requests waiting for review and decision.
          </p>
        </div>

        {isPendingLoading ? (
          <LoadingState message="Loading pending approvals..." />
        ) : pendingInstances.length === 0 ? (
          <EmptyState
            title="No pending approvals"
            message="There are no approval requests waiting for review."
          />
        ) : (
          <>
            {renderApprovalTable(pendingInstances, "Review", "primary")}

            <Pagination
              page={pendingPage}
              pageSize={pendingPageSize}
              totalItems={pendingTotalCount}
              onPageChange={setPendingPage}
              onPageSizeChange={handlePendingPageSizeChange}
            />
          </>
        )}
      </Card>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Recent Approval History
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Recently approved or rejected procurement requests.
          </p>
        </div>

        {isHistoryLoading ? (
          <LoadingState message="Loading approval history..." />
        ) : historyInstances.length === 0 ? (
          <EmptyState
            title="No completed approvals"
            message="Approved and rejected requests will appear here once actions are taken."
          />
        ) : (
          <>
            {renderApprovalTable(historyInstances, "View", "secondary", true)}

            <Pagination
              page={historyPage}
              pageSize={historyPageSize}
              totalItems={historyTotalCount}
              onPageChange={setHistoryPage}
              onPageSizeChange={handleHistoryPageSizeChange}
            />
          </>
        )}
      </Card>
    </PageContainer>
  );
}

export default ApprovalQueuePage;
