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
  SupplierSpendReportItem,
} from "../types/report.types";

import { downloadFile } from "../utils/reportFormatter";
import { formatCurrency } from "../../../utils/formatCurrency";
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
    supplier_category: searchParams.get("supplier_category") || undefined,
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
  if (filters.supplier_category)
    params.set("supplier_category", filters.supplier_category);
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

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function buildSupplierCategoryTotals(rows: SupplierSpendReportItem[]) {
  const categoryMap = new Map<
    string,
    {
      category: string;
      supplierCount: number;
      invoiceValue: number;
      paidAmount: number;
      outstandingAmount: number;
      currency: string;
    }
  >();

  for (const row of rows) {
    const category = row.supplier_category || "Uncategorised";
    const existing = categoryMap.get(category) ?? {
      category,
      supplierCount: 0,
      invoiceValue: 0,
      paidAmount: 0,
      outstandingAmount: 0,
      currency: row.base_currency || "KES",
    };

    existing.supplierCount += 1;
    existing.invoiceValue += toNumber(
      row.base_total_invoice_amount ?? row.total_invoice_amount,
    );
    existing.paidAmount += toNumber(
      row.base_total_paid_amount ?? row.total_paid_amount,
    );
    existing.outstandingAmount += toNumber(
      row.base_outstanding_amount ?? row.outstanding_amount,
    );

    categoryMap.set(category, existing);
  }

  return Array.from(categoryMap.values()).sort(
    (first, second) => second.invoiceValue - first.invoiceValue,
  );
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
  const supplierCategoryTotals =
    activeReport === "supplier-spend"
      ? buildSupplierCategoryTotals(data as SupplierSpendReportItem[])
      : [];
  const supplierCategoryOptions = supplierOptions
    .map((supplier) => supplier.category)
    .filter(
      (category): category is string =>
        typeof category === "string" && category.trim().length > 0,
    )
    .filter((category, index, categories) => categories.indexOf(category) === index)
    .sort((first, second) => first.localeCompare(second))
    .map((category) => ({
      label: category,
      value: category,
    }));

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
      } catch (error) {
        setRecordsError(
          await getApiErrorMessage(
            error,
            `Failed to load ${currentReport.title.toLowerCase()}.`,
          ),
        );
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
      <PageContainer className="module-theme module-reports">
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
      <PageContainer className="module-theme module-reports">
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
    <PageContainer className="module-theme module-reports">
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
              supplierCategoryOptions={supplierCategoryOptions}
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

          {!recordsError &&
            hasRows &&
            activeReport === "supplier-spend" &&
            supplierCategoryTotals.length > 0 && (
              <Card>
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-primary-black">
                      Spend by Supplier Category
                    </h2>
                    <p className="mt-1 text-sm text-primary-gray">
                      Category totals use the same base-currency values shown
                      in the supplier spend rows.
                    </p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary-blue">
                    {supplierCategoryTotals.length} categories
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {supplierCategoryTotals.map((category) => (
                    <div
                      key={category.category}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-primary-black">
                            {category.category}
                          </p>
                          <p className="mt-1 text-xs text-primary-gray">
                            {category.supplierCount} supplier
                            {category.supplierCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
                          {category.currency}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-primary-gray">
                            Invoice value
                          </span>
                          <span className="font-semibold text-primary-black">
                            {formatCurrency(
                              category.invoiceValue,
                              category.currency,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-primary-gray">Paid</span>
                          <span className="font-semibold text-green-700">
                            {formatCurrency(
                              category.paidAmount,
                              category.currency,
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-primary-gray">
                            Outstanding
                          </span>
                          <span className="font-semibold text-primary-blue">
                            {formatCurrency(
                              category.outstandingAmount,
                              category.currency,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
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
