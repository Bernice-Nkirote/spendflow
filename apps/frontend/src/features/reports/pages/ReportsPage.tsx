import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import LoadingState from "../../../components/ui/LoadingState";

import {
  getDepartmentOptions,
  getSupplierOptions,
} from "../api/reportOptionsApi";

import {
  getPaymentMethodOptions,
  getReportStatusOptions,
} from "../api/reportMetadataApi";

import ReportFilters from "../components/ReportFilters";
import ReportHeader from "../components/ReportHeader";
import ReportPagination from "../components/ReportPagination";
import ReportTable from "../components/ReportTable";
import ReportTabs, { type ReportType } from "../components/ReportTabs";
import ReportSummaryCards from "../components/ReportSummaryCards";

import { reportRegistry } from "../config/reportRegistry";

import type {
  ReportFilterOption,
  ReportFilters as ReportFiltersType,
  ReportStatusOptions,
} from "../types/report.types";

import { downloadFile } from "../utils/reportFormatter";

const DEFAULT_REPORT: ReportType = "purchase-requisitions";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

function getInitialReport(reportFromUrl: string | null): ReportType {
  if (reportFromUrl && reportFromUrl in reportRegistry) {
    return reportFromUrl as ReportType;
  }

  return DEFAULT_REPORT;
}

function getInitialFilters(searchParams: URLSearchParams): ReportFiltersType {
  return {
    page: Number(searchParams.get("page")) || DEFAULT_PAGE,
    page_size: Number(searchParams.get("page_size")) || DEFAULT_PAGE_SIZE,
    date_from: searchParams.get("date_from") || undefined,
    date_to: searchParams.get("date_to") || undefined,
    status: searchParams.get("status") || undefined,
    supplier_id: searchParams.get("supplier_id") || undefined,
    department_id: searchParams.get("department_id") || undefined,
    payment_method: searchParams.get("payment_method") || undefined,
  };
}

function buildReportSearchParams(
  activeReport: ReportType,
  filters: ReportFiltersType,
): URLSearchParams {
  const params = new URLSearchParams();

  params.set("report", activeReport);
  params.set("page", String(filters.page ?? DEFAULT_PAGE));
  params.set("page_size", String(filters.page_size ?? DEFAULT_PAGE_SIZE));

  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.status) params.set("status", filters.status);
  if (filters.supplier_id) params.set("supplier_id", filters.supplier_id);
  if (filters.department_id) {
    params.set("department_id", filters.department_id);
  }
  if (filters.payment_method) {
    params.set("payment_method", filters.payment_method);
  }
  return params;
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeReport, setActiveReport] = useState<ReportType>(() =>
    getInitialReport(searchParams.get("report")),
  );

  const [filters, setFilters] = useState<ReportFiltersType>(() =>
    getInitialFilters(searchParams),
  );

  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [departmentOptions, setDepartmentOptions] = useState<
    ReportFilterOption[]
  >([]);

  const [supplierOptions, setSupplierOptions] = useState<ReportFilterOption[]>(
    [],
  );

  const [statusOptions, setStatusOptions] = useState<ReportStatusOptions>({});
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<string[]>(
    [],
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);

  const currentReport = reportRegistry[activeReport];
  const isReportEnabled = Boolean(currentReport?.isEnabled);

  /**
   * Keeps the active report and filters reflected in the URL.
   * This makes report pages shareable and preserves state after refresh.
   */
  useEffect(() => {
    const params = buildReportSearchParams(activeReport, filters);
    setSearchParams(params, { replace: true });
  }, [activeReport, filters, setSearchParams]);

  /**
   * Loads reusable dropdown metadata used by report filters.
   * Report rendering should not fail if these options fail to load.
   */
  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [departments, suppliers, statuses, paymentMethods] =
          await Promise.all([
            getDepartmentOptions(),
            getSupplierOptions(),
            getReportStatusOptions(),
            getPaymentMethodOptions(),
          ]);

        setDepartmentOptions(departments);
        setSupplierOptions(suppliers);
        setStatusOptions(statuses);
        setPaymentMethodOptions(paymentMethods);
      } catch {
        setDepartmentOptions([]);
        setSupplierOptions([]);
        setStatusOptions({});
        setPaymentMethodOptions([]);
      }
    }

    loadFilterOptions();
  }, []);

  /**
   * Loads the currently selected report using the registry configuration.
   * and ReportsPage stays generic and does not contain report-specific API logic.
   */
  useEffect(() => {
    async function fetchActiveReport() {
      if (!currentReport?.isEnabled || !currentReport.fetchReport) return;

      try {
        setLoading(true);
        setError(null);

        const response = await currentReport.fetchReport(filters);

        setData(response.rows);
        setTotalCount(response.total_count);
      } catch {
        setError(`Failed to load ${currentReport.title.toLowerCase()}.`);
      } finally {
        setLoading(false);
      }
    }

    fetchActiveReport();
  }, [activeReport, filters, currentReport]);

  function handleReportChange(report: ReportType) {
    setActiveReport(report);

    setFilters({
      page: DEFAULT_PAGE,
      page_size: DEFAULT_PAGE_SIZE,
    });

    setData([]);
    setTotalCount(0);
    setError(null);
  }

  function handlePageChange(page: number) {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  }

  function handlePageSizeChange(pageSize: number) {
    setFilters((prev) => ({
      ...prev,
      page: DEFAULT_PAGE,
      page_size: pageSize,
    }));
  }

  async function handleExportCSV() {
    if (!currentReport?.exportCSV) return;

    try {
      setExporting("csv");

      const blob = await currentReport.exportCSV(filters);
      downloadFile(blob, currentReport.csvFilename);
    } catch {
      alert("Failed to export CSV");
    } finally {
      setExporting(null);
    }
  }

  async function handleExportExcel() {
    if (!currentReport?.exportExcel) return;

    try {
      setExporting("excel");

      const blob = await currentReport.exportExcel(filters);
      downloadFile(blob, currentReport.excelFilename);
    } catch {
      alert("Failed to export Excel");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 overflow-hidden sm:gap-6">
      <ReportHeader
        title={currentReport.title}
        onExportCSV={isReportEnabled ? handleExportCSV : undefined}
        onExportExcel={isReportEnabled ? handleExportExcel : undefined}
        exporting={exporting}
      />

      <ReportTabs activeReport={activeReport} onChange={handleReportChange} />

      {!isReportEnabled ? (
        <EmptyState
          title="No report data found"
          message={currentReport.emptyMessage}
        />
      ) : (
        <>
          <ReportFilters
            filters={filters}
            filterConfig={currentReport.filters}
            onChange={setFilters}
            departmentOptions={departmentOptions}
            supplierOptions={supplierOptions}
            statusOptions={statusOptions[activeReport] ?? []}
            paymentMethodOptions={paymentMethodOptions}
          />

          {!loading && !error && data.length > 0 && (
            <ReportSummaryCards
              data={data}
              totalCount={totalCount}
              cards={currentReport.summaryCards}
            />
          )}

          {loading && <LoadingState />}

          {!loading && error && <ErrorState message={error} />}

          {!loading && !error && data.length === 0 && (
            <EmptyState
              title="No report data found"
              message={currentReport.emptyMessage}
            />
          )}

          {!loading && !error && data.length > 0 && (
            <>
              <div className="min-w-0 space-y-4">
                <ReportTable columns={currentReport.columns} data={data} />

                <ReportPagination
                  page={filters.page ?? DEFAULT_PAGE}
                  pageSize={filters.page_size ?? DEFAULT_PAGE_SIZE}
                  totalCount={totalCount}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
