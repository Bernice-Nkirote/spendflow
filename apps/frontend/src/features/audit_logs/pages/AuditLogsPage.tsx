import { Fragment, useEffect, useMemo, useState } from "react";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import LoadingState from "../../../components/ui/LoadingState";
import { getAuditLogs } from "../api/auditLogApi";
import type { AuditLog, AuditLogFilters } from "../types/auditLog.types";

const ENTITY_FILTERS = [
  { label: "All entities", value: "" },
  { label: "Purchase Requisition", value: "PR" },
  { label: "Purchase Order", value: "PO" },
  { label: "Invoice", value: "INVOICE" },
  { label: "Payment", value: "PAYMENT" },
  { label: "Supplier", value: "SUPPLIER" },
  { label: "Supplier User", value: "SUPPLIER_USER" },
  { label: "Role", value: "ROLE" },
  { label: "Permission", value: "PERMISSION" },
  { label: "Role Permission", value: "ROLE_PERMISSION" },
  { label: "Approval", value: "APPROVAL" },
];

const ACTION_FILTERS = [
  { label: "All actions", value: "" },
  { label: "Permission Assigned", value: "PERMISSION_ASSIGNED" },
  { label: "Permission Removed", value: "PERMISSION_REMOVED" },
  { label: "Permission Created", value: "PERMISSION_CREATED" },
  { label: "Permission Updated", value: "PERMISSION_UPDATED" },
  { label: "Permission Activated", value: "PERMISSION_ACTIVATED" },
  { label: "Permission Deactivated", value: "PERMISSION_DEACTIVATED" },
  { label: "Payment Created", value: "PAYMENT_CREATED" },
  { label: "Payment Submitted", value: "PAYMENT_SUBMITTED" },
  { label: "Payment Updated", value: "PAYMENT_UPDATED" },
  { label: "Payment Cancelled", value: "PAYMENT_CANCELLED" },
  { label: "Invoice Created", value: "INVOICE_CREATED" },
  { label: "Invoice Submitted", value: "INVOICE_SUBMITTED" },
  { label: "Invoice Updated", value: "INVOICE_UPDATED" },
  { label: "Approval Approved", value: "APPROVAL_APPROVED" },
  { label: "Approval Rejected", value: "APPROVAL_REJECTED" },
];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFallbackLabel(value: string | null | undefined) {
  if (!value) return "Not provided";

  return value
    .replaceAll("_", " ")
    .replaceAll(".", " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getActorDisplay(log: AuditLog) {
  if (log.actor_name && log.actor_email) {
    return `${log.actor_name} (${log.actor_email})`;
  }

  if (log.actor_name) return log.actor_name;
  if (log.actor_email) return log.actor_email;

  return "System or unavailable actor";
}

function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState<AuditLogFilters>({
    action: "",
    entity_type: "",
    date_from: "",
    date_to: "",
  });
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState("");
  const [error, setError] = useState("");

  async function loadAuditLogs(nextFilters = filters) {
    try {
      setIsLoading(true);
      setError("");

      const data = await getAuditLogs(nextFilters);
      setLogs(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Failed to load audit logs.");
      setAlertMessage("Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const totalLogs = logs.length;

  const internalActorCount = useMemo(
    () => logs.filter((log) => log.actor_type === "Internal User").length,
    [logs],
  );

  const supplierActorCount = useMemo(
    () => logs.filter((log) => log.actor_type === "Supplier User").length,
    [logs],
  );

  function updateFilter(name: keyof AuditLogFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleApplyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      filters.date_from &&
      filters.date_to &&
      filters.date_from > filters.date_to
    ) {
      setAlertMessage("Start date cannot be after end date.");
      return;
    }

    await loadAuditLogs(filters);
  }

  async function handleResetFilters() {
    const emptyFilters = {
      action: "",
      entity_type: "",
      date_from: "",
      date_to: "",
    };

    setFilters(emptyFilters);
    await loadAuditLogs(emptyFilters);
  }

  return (
    <div className="min-w-0 max-w-full space-y-6 overflow-hidden">
      {alertMessage && (
        <FloatingAlert
          type="error"
          message={alertMessage}
          onClose={() => setAlertMessage("")}
        />
      )}

      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-primary-black">Audit Logs</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-600">
          Review traceable system activity across users, suppliers, approvals,
          payments, permissions, and procurement records.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <p className="text-sm text-gray-500">Visible logs</p>
          <p className="mt-2 text-2xl font-bold text-primary-black">
            {totalLogs}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Internal user actions</p>
          <p className="mt-2 text-2xl font-bold text-primary-black">
            {internalActorCount}
          </p>
        </Card>

        <Card>
          <p className="text-sm text-gray-500">Supplier user actions</p>
          <p className="mt-2 text-2xl font-bold text-primary-black">
            {supplierActorCount}
          </p>
        </Card>
      </div>

      <Card>
        <form onSubmit={handleApplyFilters} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-primary-black">
              Filter activity
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Narrow audit history by entity, action, or date range.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Entity
              </label>
              <select
                value={filters.entity_type}
                onChange={(event) =>
                  updateFilter("entity_type", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              >
                {ENTITY_FILTERS.map((entity) => (
                  <option key={entity.value || "all"} value={entity.value}>
                    {entity.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Action
              </label>
              <select
                value={filters.action}
                onChange={(event) => updateFilter("action", event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              >
                {ACTION_FILTERS.map((action) => (
                  <option key={action.value || "all"} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                From
              </label>
              <input
                type="date"
                value={filters.date_from}
                onChange={(event) =>
                  updateFilter("date_from", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                To
              </label>
              <input
                type="date"
                value={filters.date_to}
                onChange={(event) =>
                  updateFilter("date_to", event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-primary-blue"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="submit">Apply Filters</Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleResetFilters}
            >
              Reset Filters
            </Button>
          </div>
        </form>
      </Card>

      {isLoading ? (
        <LoadingState message="Loading audit logs..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : logs.length === 0 ? (
        <EmptyState
          title="No audit logs found"
          message="Try adjusting the filters or perform an auditable action first."
        />
      ) : (
        <Card>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-primary-black">
              Activity history
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Expand a row to review descriptions, old values, new values, and
              extra context.
            </p>
          </div>

          <div className="max-w-full overflow-x-auto rounded-xl border border-gray-100">
            <table className="min-w-[820px] text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {logs.map((log) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <Fragment key={log.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <span className="inline-flex whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                            {log.action_label ||
                              formatFallbackLabel(log.action)}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <span className="inline-flex whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {log.entity_label ||
                              formatFallbackLabel(log.entity_type)}
                          </span>
                        </td>

                        <td className="max-w-[180px] truncate px-4 py-3 font-medium text-primary-black">
                          {log.entity_reference || "Not provided"}
                        </td>

                        <td className="max-w-[240px] truncate px-4 py-3 text-gray-700">
                          <div className="truncate">{getActorDisplay(log)}</div>
                          {log.actor_type && (
                            <p className="mt-1 text-xs text-gray-500">
                              {log.actor_type}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                          {formatDateTime(log.created_at)}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedLogId(isExpanded ? null : log.id)
                            }
                            className="whitespace-nowrap text-sm font-medium text-primary-blue hover:underline"
                          >
                            {isExpanded ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-gray-50 px-4 py-4">
                            <div className="grid gap-4 lg:grid-cols-3">
                              <div className="rounded-xl border bg-white p-4">
                                <p className="text-xs font-semibold uppercase text-gray-500">
                                  Description
                                </p>
                                <p className="mt-2 text-sm text-gray-700">
                                  {log.description ||
                                    "No description provided."}
                                </p>
                              </div>

                              <div className="rounded-xl border bg-white p-4">
                                <p className="text-xs font-semibold uppercase text-gray-500">
                                  Changed From
                                </p>
                                <div className="mt-2 space-y-1 text-sm text-gray-700">
                                  {log.old_values_json &&
                                  Object.keys(log.old_values_json).length >
                                    0 ? (
                                    Object.entries(log.old_values_json).map(
                                      ([key, value]) => (
                                        <p key={key}>
                                          <span className="font-medium">
                                            {formatFallbackLabel(key)}:
                                          </span>{" "}
                                          {String(value)}
                                        </p>
                                      ),
                                    )
                                  ) : (
                                    <p>No previous values recorded.</p>
                                  )}
                                </div>
                              </div>

                              <div className="rounded-xl border bg-white p-4">
                                <p className="text-xs font-semibold uppercase text-gray-500">
                                  Changed To / Details
                                </p>
                                <div className="mt-2 space-y-1 text-sm text-gray-700">
                                  {(log.new_values_json || log.details_json) &&
                                  Object.keys(
                                    log.new_values_json ??
                                      log.details_json ??
                                      {},
                                  ).length > 0 ? (
                                    Object.entries(
                                      log.new_values_json ??
                                        log.details_json ??
                                        {},
                                    ).map(([key, value]) => (
                                      <p key={key}>
                                        <span className="font-medium">
                                          {formatFallbackLabel(key)}:
                                        </span>{" "}
                                        {String(value)}
                                      </p>
                                    ))
                                  ) : (
                                    <p>No extra details recorded.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default AuditLogsPage;
