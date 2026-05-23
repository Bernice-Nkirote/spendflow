import axiosInstance from "../../../api/axiosInstance";
import type {
  AuditLog,
  AuditLogFilters,
  PaginatedAuditLogsResponse,
} from "../types/auditLog.types";

function cleanFilters(filters: AuditLogFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== undefined && value !== "",
    ),
  );
}

export async function getAuditLogs(
  filters: AuditLogFilters = {},
): Promise<AuditLog[]> {
  const hasFilters = Object.values(filters).some(Boolean);

  const response = await axiosInstance.get<AuditLog[]>(
    hasFilters ? "/audit-logs/search" : "/audit-logs/",
    {
      params: cleanFilters(filters),
    },
  );

  return response.data;
}

export async function getPaginatedAuditLogs({
  skip,
  limit,
  filters = {},
}: {
  skip: number;
  limit: number;
  filters?: AuditLogFilters;
}): Promise<PaginatedAuditLogsResponse> {
  const response = await axiosInstance.get<PaginatedAuditLogsResponse>(
    "/audit-logs/paginated",
    {
      params: {
        ...cleanFilters(filters),
        skip,
        limit,
      },
    },
  );

  return response.data;
}
