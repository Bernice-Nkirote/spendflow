import Card from "../../../components/ui/Card";
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
      <Card className="border-blue-300 bg-[#DBEAFE]">
        <p className="text-sm font-medium text-blue-700">Invoice</p>

        <p className="mt-2 truncate text-xl font-semibold text-blue-900">
          {invoiceNumber}
        </p>
      </Card>

      <Card className="border-gray-300 bg-[#F3F4F6]">
        <p className="text-sm font-medium text-gray-600">Supplier</p>

        <p className="mt-2 truncate text-xl font-semibold text-primary-black">
          {supplierName ?? "-"}
        </p>
      </Card>

      <Card className="border-green-300 bg-[#DCFCE7]">
        <p className="text-sm font-medium text-green-700">Completed Paid</p>

        <p className="mt-2 text-xl font-semibold text-green-800">
          {formatCurrency(completedPaidTotal, currency ?? undefined)}
        </p>
      </Card>

      <Card className="border-red-300 bg-[#FEE2E2]">
        <p className="text-sm font-medium text-red-700">Balance Remaining</p>

        <p className="mt-2 text-xl font-semibold text-red-800">
          {formatCurrency(balanceRemaining, currency ?? undefined)}
        </p>
      </Card>
    </section>
  );
}
