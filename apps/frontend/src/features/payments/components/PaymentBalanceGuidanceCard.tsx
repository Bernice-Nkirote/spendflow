import { formatCurrency } from "../../../utils/formatCurrency";

type PaymentBalanceGuidanceCardProps = {
  invoiceTotal: number;
  pendingApprovalTotal: number;
  balanceRemaining: number;
  currency?: string | null;
};

export default function PaymentBalanceGuidanceCard({
  invoiceTotal,
  pendingApprovalTotal,
  balanceRemaining,
  currency,
}: PaymentBalanceGuidanceCardProps) {
  return (
    <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold text-yellow-800">
        Payment balance guidance
      </h2>

      <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-yellow-700">Invoice Total</p>
          <p className="font-semibold text-yellow-900">
            {formatCurrency(invoiceTotal, currency ?? undefined)}
          </p>
        </div>

        <div>
          <p className="text-yellow-700">Pending Approval / Reserved</p>
          <p className="font-semibold text-yellow-900">
            {formatCurrency(pendingApprovalTotal, currency ?? undefined)}
          </p>
        </div>

        <div>
          <p className="text-yellow-700">Maximum New Payment</p>
          <p className="font-semibold text-yellow-900">
            {formatCurrency(balanceRemaining, currency ?? undefined)}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-yellow-700">
        Draft payments do not reserve the invoice balance. Submitted payments
        awaiting approval and completed payments are counted before allowing
        another payment.
      </p>
    </section>
  );
}
