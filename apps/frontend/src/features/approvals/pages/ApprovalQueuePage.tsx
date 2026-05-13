import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getApprovalInstances } from "../api/approvalApi";
import type { ApprovalInstance } from "../types/approval.types";
import ApprovalStatusBadge from "../components/ApprovalStatusBadge";
import { formatCurrency } from "../../../utils/formatCurrency";

function ApprovalQueuePage() {
  const [instances, setInstances] = useState<ApprovalInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  const historyPageSize = 5;

  useEffect(() => {
    async function loadApprovals() {
      try {
        setIsLoading(true);
        setError("");

        const data = await getApprovalInstances();
        setInstances(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load approval queue.");
      } finally {
        setIsLoading(false);
      }
    }

    loadApprovals();
  }, []);

  const pendingInstances = instances.filter(
    (instance) => instance.status === "PENDING",
  );

  const completedInstances = instances.filter(
    (instance) => instance.status !== "PENDING",
  );

  const totalHistoryPages = Math.max(
    1,
    Math.ceil(completedInstances.length / historyPageSize),
  );

  const paginatedCompletedInstances = completedInstances.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review pending procurement approvals.
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Pending Approval Queue
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-gray-500">Loading approvals...</div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : pendingInstances.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No pending approvals found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[1000px] border-separate border-spacing-0 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Entity Type
                  </th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Reference
                  </th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Requester
                  </th>
                  <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Amount
                  </th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Status
                  </th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Created
                  </th>
                  <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {pendingInstances.map((instance) => (
                  <tr
                    key={instance.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="border-b px-4 py-3 font-medium text-primary-black">
                      {instance.entity_type}
                    </td>

                    <td className="border-b px-4 py-3 font-medium text-primary-black">
                      {instance.entity_reference || "Not available"}
                    </td>

                    <td className="border-b px-4 py-3 text-primary-gray">
                      {instance.requester_name || "-"}
                    </td>

                    <td className="border-b px-4 py-3 text-right tabular-nums text-primary-black">
                      {formatCurrency(
                        Number(instance.total_amount ?? 0),
                        instance.currency || "KES",
                      )}
                    </td>

                    <td className="border-b px-4 py-3">
                      <ApprovalStatusBadge status={instance.status} />
                    </td>

                    <td className="border-b px-4 py-3 text-primary-gray">
                      {new Date(instance.created_at).toLocaleDateString()}
                    </td>

                    <td className="border-b px-4 py-3 text-right">
                      <Link
                        to={`/approvals/${instance.id}`}
                        className="rounded-lg bg-primary-blue px-4 py-2 text-xs font-semibold text-white hover:bg-primary-blue/90"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Approval History
          </h2>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-gray-500">
            Loading approval history...
          </div>
        ) : error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : completedInstances.length === 0 ? (
          <div className="p-6 text-sm text-gray-500">
            No completed approvals found.
          </div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[1000px] border-separate border-spacing-0 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Entity Type
                  </th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Reference
                  </th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Requester
                  </th>
                  <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Amount
                  </th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Status
                  </th>
                  <th className="border-b px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Last Comment
                  </th>
                  <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {paginatedCompletedInstances.map((instance) => {
                  const lastAction =
                    instance.actions?.[instance.actions.length - 1];

                  return (
                    <tr
                      key={instance.id}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="border-b px-4 py-3 font-medium text-primary-black">
                        {instance.entity_type}
                      </td>

                      <td className="border-b px-4 py-3 font-medium text-primary-black">
                        {instance.entity_reference || "Not available"}
                      </td>

                      <td className="border-b px-4 py-3 text-primary-gray">
                        {instance.requester_name || "-"}
                      </td>

                      <td className="border-b px-4 py-3 text-right tabular-nums text-primary-black">
                        {formatCurrency(
                          Number(instance.total_amount ?? 0),
                          instance.currency || "KES",
                        )}
                      </td>

                      <td className="border-b px-4 py-3">
                        <ApprovalStatusBadge status={instance.status} />
                      </td>

                      <td className="border-b px-4 py-3 text-primary-gray">
                        {lastAction?.comment || "No comment provided."}
                      </td>

                      <td className="border-b px-4 py-3 text-right">
                        <Link
                          to={`/approvals/${instance.id}`}
                          className="rounded-lg border px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {completedInstances.length > historyPageSize && (
          <div className="flex flex-col gap-3 border-t px-4 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-primary-gray">
              Page {historyPage} of {totalHistoryPages}
            </p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                disabled={historyPage === 1}
                className="rounded-lg border px-3 py-2 font-medium text-primary-gray hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setHistoryPage((page) =>
                    Math.min(totalHistoryPages, page + 1),
                  )
                }
                disabled={historyPage === totalHistoryPages}
                className="rounded-lg border px-3 py-2 font-medium text-primary-gray hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ApprovalQueuePage;
