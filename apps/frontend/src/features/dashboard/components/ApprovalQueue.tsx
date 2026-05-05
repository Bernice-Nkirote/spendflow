import type { ApprovalQueueItem } from "../types/dashboard.types";
import EmptyState from "../../../components/ui/EmptyState";

type ApprovalQueueProps = {
  items: ApprovalQueueItem[] | undefined;
};

const statusClasses: Record<string, string> = {
  APPROVED: "bg-green-50 text-green-700 ring-green-600/20",
  PENDING: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
  REJECTED: "bg-red-50 text-red-700 ring-red-600/20",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ApprovalQueue({ items }: ApprovalQueueProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Approval Queue</h2>
        <p className="mt-1 text-sm text-gray-500">
          Documents currently requiring approval action.
        </p>
      </div>

      {!items || items.length === 0 ? (
        <EmptyState message="No pending approvals" />
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Document
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Requested By
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">
                  Created
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 bg-white">
              {items.slice(0, 5).map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">
                      {item.documentReference}
                    </p>
                    <p className="text-xs text-gray-500">{item.documentType}</p>
                  </td>

                  <td className="px-4 py-3 text-gray-600">
                    {item.requestedBy ?? "Unknown user"}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                        statusClasses[item.status] ??
                        "bg-gray-50 text-gray-700 ring-gray-600/20"
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(item.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
