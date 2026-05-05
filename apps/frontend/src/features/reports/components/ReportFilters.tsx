import type {
  ReportFilterConfig,
  ReportFilterOption,
  ReportFilters as ReportFiltersType,
} from "../types/report.types";

type Props = {
  filters: ReportFiltersType;
  filterConfig: ReportFilterConfig[];
  onChange: (filters: ReportFiltersType) => void;
  supplierOptions?: ReportFilterOption[];
  departmentOptions?: ReportFilterOption[];
  statusOptions?: string[];
  paymentMethodOptions?: string[];
};

export default function ReportFilters({
  filters,
  filterConfig,
  onChange,
  supplierOptions = [],
  departmentOptions = [],
  statusOptions = [],
  paymentMethodOptions = [],
}: Props) {
  const hasFilter = (type: ReportFilterConfig["type"]) =>
    filterConfig.some((filter) => filter.type === type);

  function handleClearFilters() {
    onChange({
      page: 1,
      page_size: filters.page_size ?? 10,
    });
  }

  const hasActiveFilters = Boolean(
    filters.date_from ||
    filters.date_to ||
    filters.status ||
    filters.supplier_id ||
    filters.department_id ||
    filters.payment_method,
  );

  return (
    <section className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-medium text-gray-700">Filters</h3>

        <button
          type="button"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          className="self-start text-sm text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400 sm:self-auto"
        >
          Clear filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hasFilter("date_range") && (
          <>
            <div className="min-w-0 flex flex-col gap-1">
              <label className="text-xs font-medium text-primary-gray">
                From
              </label>
              <input
                type="date"
                value={filters.date_from ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    page: 1,
                    date_from: e.target.value || undefined,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>

            <div className="min-w-0 flex flex-col gap-1">
              <label className="text-xs font-medium text-primary-gray">
                To
              </label>
              <input
                type="date"
                value={filters.date_to ?? ""}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    page: 1,
                    date_to: e.target.value || undefined,
                  })
                }
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
              />
            </div>
          </>
        )}

        {hasFilter("status") && (
          <div className="min-w-0 flex flex-col gap-1">
            <label className="text-xs font-medium text-primary-gray">
              {filterConfig.find((filter) => filter.type === "status")?.label ??
                "Status"}
            </label>

            <select
              value={filters.status ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  page: 1,
                  status: e.target.value || undefined,
                })
              }
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">
                {statusOptions.length === 0
                  ? "Loading statuses..."
                  : "All statuses"}
              </option>

              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status
                    .toLowerCase()
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasFilter("supplier") && (
          <div className="min-w-0 flex flex-col gap-1">
            <label className="text-xs font-medium text-primary-gray">
              Supplier
            </label>

            <select
              value={filters.supplier_id ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  page: 1,
                  supplier_id: e.target.value || undefined,
                })
              }
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">All suppliers</option>
              {supplierOptions.map((supplier) => (
                <option key={supplier.value} value={supplier.value}>
                  {supplier.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasFilter("department") && (
          <div className="min-w-0 flex flex-col gap-1">
            <label className="text-xs font-medium text-primary-gray">
              Department
            </label>

            <select
              value={filters.department_id ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  page: 1,
                  department_id: e.target.value || undefined,
                })
              }
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">All departments</option>
              {departmentOptions.map((department) => (
                <option key={department.value} value={department.value}>
                  {department.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasFilter("payment_method") && (
          <div className="min-w-0 flex flex-col gap-1">
            <label className="text-xs font-medium text-primary-gray">
              Payment Method
            </label>

            <select
              value={filters.payment_method ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  page: 1,
                  payment_method: e.target.value || undefined,
                })
              }
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
            >
              <option value="">
                {paymentMethodOptions.length === 0
                  ? "Loading methods..."
                  : "All methods"}
              </option>

              {paymentMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {method
                    .toLowerCase()
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </section>
  );
}
