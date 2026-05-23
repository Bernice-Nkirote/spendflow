import axios from "axios";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import EmptyState from "../../../components/ui/EmptyState";
import ErrorState from "../../../components/ui/ErrorState";
import FloatingAlert from "../../../components/ui/FloatingAlert";
import LoadingState from "../../../components/ui/LoadingState";
import PageContainer from "../../../components/ui/PageContainer";
import PageHeader from "../../../components/ui/PageHeader";
import { useFloatingAlert } from "../../../components/ui/useFloatingAlert";

import {
  getDepartmentOptions,
  getSupplierOptions,
} from "../api/reportOptionsApi";

import {
  getPaymentMethodOptions,
  getReportStatusOptions,
} from "../api/reportMetadataApi";

import ReportFilters from "../components/ReportFilters";
import ReportPagination from "../components/ReportPagination";
import ReportTable from "../components/ReportTable";
import ReportTabs, { reports, type ReportType } from "../components/ReportTabs";
import ReportSummaryCards from "../components/ReportSummaryCards";

import { reportRegistry } from "../config/reportRegistry";

import type {
  ReportFilterOption,
  ReportFilters as ReportFiltersType,
  ReportStatusOptions,
} from "../types/report.types";

import { downloadFile } from "../utils/reportFormatter";
import { userHasPermission } from "../../../utils/permissions";

const DEFAULT_REPORT: ReportType = "purchase-requisitions";

function getAllowedReports(): ReportType[] {
  return reports
    .filter((report) => userHasPermission(report.permission))
    .map((report) => report.value);
}

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
  if (filters.department_id) params.set("department_id", filters.department_id);
  if (filters.payment_method)
    params.set("payment_method", filters.payment_method);

  return params;
}

async function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (error.response?.data instanceof Blob) {
      const text = await error.response.data.text();

      try {
        const parsed = JSON.parse(text);

        if (typeof parsed.detail === "string") {
          return parsed.detail;
        }
      } catch {
        return text || fallback;
      }
    }
  }

  return fallback;
}

export default function ReportsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { alert, showAlert, clearAlert } = useFloatingAlert();

  const [activeReport, setActiveReport] = useState<ReportType>(() => {
    const allowedReports = getAllowedReports();
    const requestedReport = getInitialReport(searchParams.get("report"));

    if (allowedReports.includes(requestedReport)) {
      return requestedReport;
    }

    return allowedReports[0] ?? DEFAULT_REPORT;
  });

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

  const [initialLoading, setInitialLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<"csv" | "excel" | null>(null);

  const allowedReports = getAllowedReports();
  const hasReportAccess = allowedReports.length > 0;
  const currentReport = reportRegistry[activeReport];
  const isReportEnabled = Boolean(currentReport?.isEnabled);
  const hasRows = data.length > 0;

  useEffect(() => {
    const params = buildReportSearchParams(activeReport, filters);
    setSearchParams(params, { replace: true });
  }, [activeReport, filters, setSearchParams]);

  useEffect(() => {
    if (!hasReportAccess) return;

    if (!allowedReports.includes(activeReport)) {
      setActiveReport(allowedReports[0]);
      setFilters({
        page: DEFAULT_PAGE,
        page_size: DEFAULT_PAGE_SIZE,
      });
      setData([]);
      setTotalCount(0);
      setRecordsError(null);
    }
  }, [activeReport, allowedReports, hasReportAccess]);

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

  useEffect(() => {
    async function fetchActiveReport() {
      if (!currentReport?.isEnabled || !currentReport.fetchReport) {
        setInitialLoading(false);
        return;
      }

      try {
        setRecordsLoading(true);
        setRecordsError(null);

        const response = await currentReport.fetchReport(filters);

        setData(response.rows);
        setTotalCount(response.total_count);
      } catch {
        setRecordsError(`Failed to load ${currentReport.title.toLowerCase()}.`);
      } finally {
        setInitialLoading(false);
        setRecordsLoading(false);
      }
    }

    fetchActiveReport();
  }, [activeReport, filters, currentReport]);

  function handleReportChange(report: ReportType) {
    if (!allowedReports.includes(report)) {
      setRecordsError("You do not have permission to view this report.");
      return;
    }

    setActiveReport(report);
    setFilters({
      page: DEFAULT_PAGE,
      page_size: DEFAULT_PAGE_SIZE,
    });
    setData([]);
    setTotalCount(0);
    setRecordsError(null);
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
      showAlert("success", "CSV report exported successfully.");
    } catch (error) {
      showAlert(
        "error",
        await getApiErrorMessage(error, "Failed to export CSV report."),
      );
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
      showAlert("success", "Excel report exported successfully.");
    } catch (error) {
      showAlert(
        "error",
        await getApiErrorMessage(error, "Failed to export Excel report."),
      );
    } finally {
      setExporting(null);
    }
  }

  const headerActions = (
    <>
      <Button
        type="button"
        variant="secondary"
        onClick={handleExportCSV}
        disabled={
          !isReportEnabled || !currentReport?.exportCSV || exporting !== null
        }
      >
        {exporting === "csv" ? "Exporting CSV..." : "Export CSV"}
      </Button>

      <Button
        type="button"
        variant="primary"
        onClick={handleExportExcel}
        disabled={
          !isReportEnabled || !currentReport?.exportExcel || exporting !== null
        }
      >
        {exporting === "excel" ? "Exporting Excel..." : "Export Excel"}
      </Button>
    </>
  );

  if (!hasReportAccess) {
    return (
      <PageContainer>
        <PageHeader
          title="Reports"
          description="View, filter, and export business-readable procurement reports."
        />

        <ErrorState message="You do not have permission to view any reports. Please contact your administrator if you need report access." />
      </PageContainer>
    );
  }

  if (initialLoading) {
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
          title="Reports"
          description="View, filter, and export business-readable procurement reports."
        />

        <LoadingState />
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
        title={currentReport.title}
        description="View, filter, and export business-readable procurement reports."
        actions={headerActions}
      />

      <ReportTabs
        activeReport={activeReport}
        onChange={handleReportChange}
        allowedReports={allowedReports}
      />

      {!isReportEnabled ? (
        <EmptyState
          title="No report data found"
          message={currentReport.emptyMessage}
        />
      ) : (
        <>
          <Card>
            <ReportFilters
              filters={filters}
              filterConfig={currentReport.filters}
              onChange={setFilters}
              departmentOptions={departmentOptions}
              supplierOptions={supplierOptions}
              statusOptions={statusOptions[activeReport] ?? []}
              paymentMethodOptions={paymentMethodOptions}
            />
          </Card>

          {recordsLoading && hasRows && (
            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Updating report data...
            </div>
          )}

          {!recordsError && hasRows && (
            <ReportSummaryCards
              data={data}
              totalCount={totalCount}
              cards={currentReport.summaryCards}
            />
          )}

          {!recordsLoading && recordsError && (
            <ErrorState message={recordsError} />
          )}

          {!recordsLoading && !recordsError && !hasRows && (
            <EmptyState
              title="No report data found"
              message={currentReport.emptyMessage}
            />
          )}

          {!recordsError && hasRows && (
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
          )}
        </>
      )}
    </PageContainer>
  );
}
