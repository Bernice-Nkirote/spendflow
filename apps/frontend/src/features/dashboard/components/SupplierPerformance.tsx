import { Link } from "react-router-dom";
import EmptyState from "../../../components/ui/EmptyState";
import { formatCurrency } from "../../../utils/formatCurrency";
import type { SupplierScorecardItem } from "../types/dashboard.types";

type SupplierPerformanceProps = {
  items: SupplierScorecardItem[] | undefined;
  currency: string | undefined;
};

const labelClasses: Record<SupplierScorecardItem["performanceLabel"], string> = {
  Excellent: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Good: "bg-blue-50 text-primary-blue ring-blue-100",
  Watch: "bg-amber-50 text-amber-700 ring-amber-100",
  New: "bg-gray-100 text-primary-gray ring-gray-200",
};

function formatDate(value?: string) {
  if (!value) return "No orders yet";

  return new Date(value).toLocaleDateString("en-KE", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SupplierPerformance({
  items,
  currency,
}: SupplierPerformanceProps) {
  const visibleItems = items?.slice(0, 5) ?? [];

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            Supplier Scorecard
          </h2>
          <p className="mt-1 text-sm leading-5 text-primary-gray">
            Performance is estimated from orders received, invoice progress, and
            supplier activity already recorded in Tendaflow.
          </p>
        </div>

        <Link
          to="/suppliers"
          className="text-sm font-semibold text-primary-blue transition hover:text-primary-black"
        >
          Manage suppliers
        </Link>
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState message="No supplier performance data yet. Add suppliers and create POs to build scorecards." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {visibleItems.map((supplier) => {
            const receivedRatio =
              supplier.totalOrders > 0
                ? Math.round(
                    (supplier.receivedOrders / supplier.totalOrders) * 100,
                  )
                : 0;
            const paymentRatio =
              supplier.invoiceCount > 0
                ? Math.round(
                    (supplier.paidInvoiceCount / supplier.invoiceCount) * 100,
                  )
                : 0;

            return (
              <Link
                key={supplier.supplierId}
                to={`/suppliers/${supplier.supplierId}`}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-blue/30 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-primary-black">
                      {supplier.supplierName}
                    </p>
                    <p className="mt-1 text-sm text-primary-gray">
                      {supplier.category ?? "Uncategorised"}
                      {supplier.subCategory ? ` / ${supplier.subCategory}` : ""}
                    </p>
                    <p className="mt-2 truncate text-xs text-primary-gray">
                      {supplier.contactPerson || supplier.email || "No contact set"}
                    </p>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${labelClasses[supplier.performanceLabel]}`}
                    >
                      {supplier.performanceLabel}
                    </span>
                    <p className="mt-2 text-2xl font-bold text-primary-blue">
                      {supplier.performanceScore}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-primary-blue transition-all"
                    style={{ width: `${supplier.performanceScore}%` }}
                  />
                </div>

                <div className="mt-4 grid gap-3 text-xs text-primary-gray sm:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="font-semibold text-primary-black">
                      {supplier.totalOrders}
                    </p>
                    <p className="mt-1">Orders</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="font-semibold text-primary-black">
                      {receivedRatio}%
                    </p>
                    <p className="mt-1">Received</p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="font-semibold text-primary-black">
                      {paymentRatio}%
                    </p>
                    <p className="mt-1">Invoice paid</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-3 text-xs text-primary-gray sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Spend:{" "}
                    <strong className="text-primary-black">
                      {formatCurrency(supplier.totalSpend, currency ?? "KES")}
                    </strong>
                  </span>
                  <span>Last order: {formatDate(supplier.lastOrderDate)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
