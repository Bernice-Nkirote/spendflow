import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getApprovalInstances } from "../api/approvalApi";
import type { ApprovalInstance } from "../types/approval.types";
import ApprovalStatusBadge from "../components/ApprovalStatusBadge";

function formatCurrency(
  value: number | string | null | undefined,
  currency = "KES",
) {
  const numericValue = Number(value ?? 0);

  try {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency || "KES",
      maximumFractionDigits: 2,
    }).format(Number.isNaN(numericValue) ? 0 : numericValue);
  } catch {
    return `${currency || "KES"} ${
      Number.isNaN(numericValue) ? "0.00" : numericValue.toFixed(2)
    }`;
  }
}

function ApprovalQueuePage() {
  const [instances, setInstances] = useState<ApprovalInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Entity Type
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {pendingInstances.map((instance) => (
                  <tr key={instance.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {instance.entity_type}
                    </td>

                    <td className="px-6 py-4 font-medium text-gray-900">
                      {instance.entity_reference || instance.entity_id}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {instance.requester_name || "-"}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {formatCurrency(
                        instance.total_amount,
                        instance.currency || "KES",
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <ApprovalStatusBadge status={instance.status} />
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {new Date(instance.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 text-right">
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
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Entity Type
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left font-semibold text-gray-600">
                    Last Comment
                  </th>
                  <th className="px-6 py-3 text-right font-semibold text-gray-600">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {completedInstances.map((instance) => {
                  const lastAction =
                    instance.actions?.[instance.actions.length - 1];

                  return (
                    <tr key={instance.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {instance.entity_type}
                      </td>

                      <td className="px-6 py-4 font-medium text-gray-900">
                        {instance.entity_reference || instance.entity_id}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {instance.requester_name || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {formatCurrency(
                          instance.total_amount,
                          instance.currency || "KES",
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <ApprovalStatusBadge status={instance.status} />
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {lastAction?.comment || "No comment provided."}
                      </td>

                      <td className="px-6 py-4 text-right">
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
      </div>
    </div>
  );
}

export default ApprovalQueuePage;
