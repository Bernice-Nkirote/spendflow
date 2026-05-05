import axiosInstance from "../../../api/axiosInstance";

import type {
  PaginatedReportResponse,
  ReportFilters,
} from "../types/report.types";

function cleanFilters(filters: ReportFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== "" && value !== undefined && value !== null,
    ),
  );
}

export async function getReport<T>(
  endpoint: string,
  filters: ReportFilters = {},
): Promise<PaginatedReportResponse<T>> {
  const response = await axiosInstance.get<PaginatedReportResponse<T>>(
    endpoint,
    {
      params: cleanFilters(filters),
    },
  );

  return response.data;
}

export async function exportReport(
  endpoint: string,
  filters: ReportFilters = {},
): Promise<Blob> {
  const response = await axiosInstance.get(endpoint, {
    params: cleanFilters(filters),
    responseType: "blob",
  });

  return response.data;
}
