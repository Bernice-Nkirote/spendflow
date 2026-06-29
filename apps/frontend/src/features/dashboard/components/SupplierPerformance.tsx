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
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-primary-black">
              Supplier Scorecard
            </h2>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-primary-blue ring-1 ring-blue-100">
              Top 5
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-primary-gray">
            Performance is estimated from orders received, invoice progress, and
            supplier activity already recorded in Tendaflow.
          </p>
        </div>

        <Link
          to="/suppliers"
          className="inline-flex items-center justify-center rounded-full border border-primary-blue/20 bg-white/80 px-4 py-2 text-sm font-semibold text-primary-blue shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-primary-blue hover:text-white hover:shadow-md"
        >
          Manage suppliers
        </Link>
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState message="No supplier performance data yet. Add suppliers and create POs to build scorecards." />
      ) : (
        <div className="space-y-3">
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
                className="block rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-primary-blue/30 hover:bg-white hover:shadow-md"
              >
                <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr_0.7fr] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-primary-black">
                        {supplier.supplierName}
                      </p>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ${labelClasses[supplier.performanceLabel]}`}
                      >
                        {supplier.performanceLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-primary-gray">
                      {supplier.category ?? "Uncategorised"}
                      {supplier.subCategory ? ` / ${supplier.subCategory}` : ""}
                    </p>
                    <p className="mt-2 truncate text-xs text-primary-gray">
                      {supplier.contactPerson || supplier.email || "No contact set"}
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                      <span className="font-semibold text-primary-black">
                        Performance
                      </span>
                      <span className="font-semibold text-primary-blue">
                        {supplier.performanceScore}%
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full brand-gradient-accent transition-all"
                        style={{ width: `${supplier.performanceScore}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-primary-gray">
                      <span>{supplier.totalOrders} orders</span>
                      <span>{receivedRatio}% received</span>
                      <span>{paymentRatio}% paid</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-50/70 p-3 text-xs text-primary-gray ring-1 ring-blue-100/70">
                    <p className="font-semibold text-primary-black">
                      {formatCurrency(supplier.totalSpend, currency ?? "KES")}
                    </p>
                    <p className="mt-1">Last order: {formatDate(supplier.lastOrderDate)}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
