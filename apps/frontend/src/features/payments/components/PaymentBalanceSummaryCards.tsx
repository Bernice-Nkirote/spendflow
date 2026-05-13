import { formatCurrency } from "../../../utils/formatCurrency";

type PaymentBalanceSummaryCardsProps = {
  invoiceNumber: string;
  supplierName?: string | null;
  completedPaidTotal: number;
  balanceRemaining: number;
  currency?: string | null;
};

export default function PaymentBalanceSummaryCards({
  invoiceNumber,
  supplierName,
  completedPaidTotal,
  balanceRemaining,
  currency,
}: PaymentBalanceSummaryCardsProps) {
  return (
    <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-primary-gray">Invoice</p>
        <p className="mt-2 truncate text-xl font-semibold text-primary-black">
          {invoiceNumber}
        </p>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <p className="text-sm text-primary-gray">Supplier</p>
        <p className="mt-2 truncate text-xl font-semibold text-primary-black">
          {supplierName ?? "-"}
        </p>
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 p-4 shadow-sm">
        <p className="text-sm font-medium text-green-700">Completed Paid</p>
        <p className="mt-2 text-xl font-semibold text-green-800">
          {formatCurrency(completedPaidTotal, currency ?? undefined)}
        </p>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm">
        <p className="text-sm font-medium text-red-700">Balance Remaining</p>
        <p className="mt-2 text-xl font-semibold text-red-800">
          {formatCurrency(balanceRemaining, currency ?? undefined)}
        </p>
      </div>
    </section>
  );
}
