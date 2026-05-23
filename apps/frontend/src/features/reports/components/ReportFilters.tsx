import Button from "../../../components/ui/Button";

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

function formatOptionLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

  const statusLabel =
    filterConfig.find((filter) => filter.type === "status")?.label ?? "Status";

  const hasActiveFilters = Boolean(
    filters.date_from ||
    filters.date_to ||
    filters.status ||
    filters.supplier_id ||
    filters.department_id ||
    filters.payment_method,
  );

  function handleClearFilters() {
    onChange({
      page: 1,
      page_size: filters.page_size ?? 10,
    });
  }

  const inputClassName =
    "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20";

  const labelClassName = "text-xs font-medium text-primary-gray";

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">Filters</h2>
          <p className="mt-1 text-sm text-gray-600">
            Narrow report results by date, status, supplier, department, or
            payment method.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
        >
          Clear filters
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {hasFilter("date_range") && (
          <>
            <div className="min-w-0 flex flex-col gap-1">
              <label className={labelClassName}>From</label>
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
                className={inputClassName}
              />
            </div>

            <div className="min-w-0 flex flex-col gap-1">
              <label className={labelClassName}>To</label>
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
                className={inputClassName}
              />
            </div>
          </>
        )}

        {hasFilter("status") && (
          <div className="min-w-0 flex flex-col gap-1">
            <label className={labelClassName}>{statusLabel}</label>

            <select
              value={filters.status ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  page: 1,
                  status: e.target.value || undefined,
                })
              }
              className={inputClassName}
            >
              <option value="">
                {statusOptions.length === 0
                  ? "Loading statuses..."
                  : "All statuses"}
              </option>

              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {formatOptionLabel(status)}
                </option>
              ))}
            </select>
          </div>
        )}

        {hasFilter("supplier") && (
          <div className="min-w-0 flex flex-col gap-1">
            <label className={labelClassName}>Supplier</label>

            <select
              value={filters.supplier_id ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  page: 1,
                  supplier_id: e.target.value || undefined,
                })
              }
              className={inputClassName}
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
            <label className={labelClassName}>Department</label>

            <select
              value={filters.department_id ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  page: 1,
                  department_id: e.target.value || undefined,
                })
              }
              className={inputClassName}
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
            <label className={labelClassName}>Payment Method</label>

            <select
              value={filters.payment_method ?? ""}
              onChange={(e) =>
                onChange({
                  ...filters,
                  page: 1,
                  payment_method: e.target.value || undefined,
                })
              }
              className={inputClassName}
            >
              <option value="">
                {paymentMethodOptions.length === 0
                  ? "Loading methods..."
                  : "All methods"}
              </option>

              {paymentMethodOptions.map((method) => (
                <option key={method} value={method}>
                  {formatOptionLabel(method)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
