import axios from "axios";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import Input from "../../../components/ui/Input";
import LoadingState from "../../../components/ui/LoadingState";
import MobileFloatingTableAction from "../../../components/ui/MobileFloatingTableAction";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import Pagination from "../../../components/ui/Pagination";
import StatusBadge from "../../../components/ui/StatusBadge";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
} from "../../../components/ui/tableStickyStyles";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";
import { getStoredUser, userHasPermission } from "../../../utils/permissions";

import { getPaginatedAuditLogs } from "../api/auditLogApi";
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

function getPositiveNumberFromSearchParam(
  value: string | null,
  fallback: number,
) {
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

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
  const [searchParams, setSearchParams] = useSearchParams();

  const page = getPositiveNumberFromSearchParam(searchParams.get("page"), 1);
  const pageSize = getPositiveNumberFromSearchParam(
    searchParams.get("page_size"),
    10,
  );

  const skip = (page - 1) * pageSize;

  const currentUser = getStoredUser();

  const canAccessAuditLogs =
    currentUser?.role_name === "Admin" ||
    currentUser?.is_company_owner === true ||
    userHasPermission("audit_logs.view");

  const filtersFromSearchParams: AuditLogFilters = {
    action: searchParams.get("action") ?? "",
    entity_type: searchParams.get("entity_type") ?? "",
    date_from: searchParams.get("date_from") ?? "",
    date_to: searchParams.get("date_to") ?? "",
  };

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<AuditLogFilters>(
    filtersFromSearchParams,
  );

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [selectedMobileLog, setSelectedMobileLog] = useState<AuditLog | null>(
    null,
  );
  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState("");

  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const internalActorCount = useMemo(
    () => logs.filter((log) => log.actor_type === "Internal User").length,
    [logs],
  );

  const supplierActorCount = useMemo(
    () => logs.filter((log) => log.actor_type === "Supplier User").length,
    [logs],
  );

  function updateSearchParams({
    nextPage,
    nextPageSize,
    nextFilters,
  }: {
    nextPage: number;
    nextPageSize: number;
    nextFilters: AuditLogFilters;
  }) {
    setSearchParams(() => {
      const nextParams = new URLSearchParams();

      nextParams.set("page", String(nextPage));
      nextParams.set("page_size", String(nextPageSize));

      Object.entries(nextFilters).forEach(([key, value]) => {
        if (value) {
          nextParams.set(key, value);
        }
      });

      return nextParams;
    });
  }

  function handlePageChange(nextPage: number) {
    setExpandedLogId(null);
    updateSearchParams({
      nextPage,
      nextPageSize: pageSize,
      nextFilters: filtersFromSearchParams,
    });
  }

  function handlePageSizeChange(nextPageSize: number) {
    setExpandedLogId(null);
    updateSearchParams({
      nextPage: 1,
      nextPageSize,
      nextFilters: filtersFromSearchParams,
    });
  }

  async function loadAuditLogs() {
    if (!canAccessAuditLogs) {
      setInitialLoading(false);
      setRecordsLoading(false);
      return;
    }
    try {
      setRecordsLoading(true);
      setRecordsError("");

      const response = await getPaginatedAuditLogs({
        skip,
        limit: pageSize,
        filters: filtersFromSearchParams,
      });

      setLogs(response.rows);
      setTotalCount(response.total_count);
    } catch (error) {
      const message = getApiErrorMessage(error, "Failed to load audit logs.");

      setRecordsError(message);
      showAlert("error", message);
    } finally {
      setRecordsLoading(false);
      setInitialLoading(false);
    }
  }

  useEffect(() => {
    setFilters(filtersFromSearchParams);
    loadAuditLogs();
  }, [
    skip,
    pageSize,
    filtersFromSearchParams.action,
    filtersFromSearchParams.entity_type,
    filtersFromSearchParams.date_from,
    filtersFromSearchParams.date_to,
    canAccessAuditLogs,
  ]);

  function updateFilter(name: keyof AuditLogFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleApplyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      filters.date_from &&
      filters.date_to &&
      filters.date_from > filters.date_to
    ) {
      showAlert("error", "Start date cannot be after end date.");
      return;
    }

    setExpandedLogId(null);

    updateSearchParams({
      nextPage: 1,
      nextPageSize: pageSize,
      nextFilters: filters,
    });
  }

  function toggleMobileLogActions(log: AuditLog) {
    setSelectedMobileLog((current) => (current?.id === log.id ? null : log));
  }

  function handleResetFilters() {
    const emptyFilters = {
      action: "",
      entity_type: "",
      date_from: "",
      date_to: "",
    };

    setFilters(emptyFilters);
    setExpandedLogId(null);

    updateSearchParams({
      nextPage: 1,
      nextPageSize: pageSize,
      nextFilters: emptyFilters,
    });
  }

  if (!canAccessAuditLogs) {
    return (
      <PageContainer>
        <PageHeader
          title="Audit Logs"
          description="Review traceable system activity across users, suppliers, approvals, payments, permissions, and procurement records."
        />

        <ErrorState message="Admin access is required to view audit logs." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {alert && (
        <FloatingAlert
          type={alert.type}
          message={alert.message}
          onClose={clearAlert}
        />
      )}

      <PageHeader
        title="Audit Logs"
        description="Review traceable system activity across users, suppliers, approvals, payments, permissions, and procurement records."
      />

      {initialLoading && <LoadingState message="Loading audit logs..." />}

      {!initialLoading && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card>
              <p className="text-sm text-gray-500">Visible logs</p>
              <p className="mt-2 break-words text-2xl font-bold tabular-nums text-primary-black">
                {logs.length}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-gray-500">Internal user actions</p>
              <p className="mt-2 break-words text-2xl font-bold tabular-nums text-primary-black">
                {internalActorCount}
              </p>
            </Card>

            <Card>
              <p className="text-sm text-gray-500">Supplier user actions</p>
              <p className="mt-2 break-words text-2xl font-bold tabular-nums text-primary-black">
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
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary-black">
                    Entity
                  </label>

                  <select
                    value={filters.entity_type}
                    onChange={(event) =>
                      updateFilter("entity_type", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                  >
                    {ENTITY_FILTERS.map((entity) => (
                      <option key={entity.value || "all"} value={entity.value}>
                        {entity.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-primary-black">
                    Action
                  </label>

                  <select
                    value={filters.action}
                    onChange={(event) =>
                      updateFilter("action", event.target.value)
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                  >
                    {ACTION_FILTERS.map((action) => (
                      <option key={action.value || "all"} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="From"
                  type="date"
                  value={filters.date_from}
                  onChange={(event) =>
                    updateFilter("date_from", event.target.value)
                  }
                />

                <Input
                  label="To"
                  type="date"
                  value={filters.date_to}
                  onChange={(event) =>
                    updateFilter("date_to", event.target.value)
                  }
                />
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

            {recordsLoading && logs.length > 0 && (
              <p className="mb-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2 text-sm text-blue-700">
                Updating audit logs...
              </p>
            )}

            {recordsError ? (
              <ErrorState message={recordsError} />
            ) : logs.length === 0 && !recordsLoading ? (
              <EmptyState
                title="No audit logs found"
                message="Try adjusting the filters or perform an auditable action first."
              />
            ) : recordsLoading && logs.length === 0 ? (
              <LoadingState message="Loading audit logs..." />
            ) : (
              <>
                <TableWrapper minWidth="900px">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className={`${stickyLeftHeader} px-4 py-3`}>
                          Action
                        </th>
                        <th className="px-4 py-3">Entity</th>
                        <th className="px-4 py-3">Reference</th>
                        <th className="px-4 py-3">Actor</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="hidden px-4 py-3 text-right lg:table-cell">
                          Details
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y">
                      {logs.map((log) => {
                        const isExpanded = expandedLogId === log.id;

                        return (
                          <Fragment key={log.id}>
                            <tr className="group hover:bg-gray-50">
                              <td className={`${stickyLeftCell} px-4 py-3`}>
                                <button
                                  type="button"
                                  onClick={() => toggleMobileLogActions(log)}
                                  className="block max-w-[220px] text-left lg:pointer-events-none"
                                  title="Tap to show details"
                                >
                                  <StatusBadge variant="info">
                                    {log.action_label ||
                                      formatFallbackLabel(log.action)}
                                  </StatusBadge>
                                </button>
                              </td>

                              <td className="px-4 py-3">
                                <StatusBadge variant="neutral">
                                  {log.entity_label ||
                                    formatFallbackLabel(log.entity_type)}
                                </StatusBadge>
                              </td>

                              <td className="max-w-[180px] truncate px-4 py-3 font-medium text-primary-black">
                                {log.entity_reference || "Not provided"}
                              </td>

                              <td className="max-w-[240px] truncate px-4 py-3 text-gray-700">
                                <div className="truncate">
                                  {getActorDisplay(log)}
                                </div>

                                {log.actor_type && (
                                  <p className="mt-1 text-xs text-gray-500">
                                    {log.actor_type}
                                  </p>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                                {formatDateTime(log.created_at)}
                              </td>

                              <td className="hidden px-4 py-3 text-right lg:table-cell">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() =>
                                    setExpandedLogId(isExpanded ? null : log.id)
                                  }
                                >
                                  {isExpanded ? "Hide" : "View"}
                                </Button>
                              </td>
                            </tr>

                            {isExpanded && (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="bg-gray-50 px-4 py-4"
                                >
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
                                        Object.keys(log.old_values_json)
                                          .length > 0 ? (
                                          Object.entries(
                                            log.old_values_json,
                                          ).map(([key, value]) => (
                                            <p key={key}>
                                              <span className="font-medium">
                                                {formatFallbackLabel(key)}:
                                              </span>{" "}
                                              {String(value)}
                                            </p>
                                          ))
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
                                        {(log.new_values_json ||
                                          log.details_json) &&
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
                </TableWrapper>

                <MobileFloatingTableAction
                  isOpen={Boolean(selectedMobileLog)}
                  reference={
                    selectedMobileLog?.entity_reference ??
                    selectedMobileLog?.action_label ??
                    "Audit log"
                  }
                  label="Selected audit log"
                  onClose={() => setSelectedMobileLog(null)}
                >
                  {selectedMobileLog && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setExpandedLogId((current) =>
                          current === selectedMobileLog.id
                            ? null
                            : selectedMobileLog.id,
                        );
                      }}
                    >
                      {expandedLogId === selectedMobileLog.id
                        ? "Hide Details"
                        : "View Details"}
                    </Button>
                  )}
                </MobileFloatingTableAction>

                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalCount}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </>
            )}
          </Card>
        </>
      )}
    </PageContainer>
  );
}

export default AuditLogsPage;
