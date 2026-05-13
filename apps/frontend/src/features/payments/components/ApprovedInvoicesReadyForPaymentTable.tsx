import { Link } from "react-router-dom";

import EmptyState from "../../../components/ui/EmptyState";
import { formatCurrency } from "../../../utils/formatCurrency";
import type { InvoiceListItem } from "../../invoices/types/invoice.types";
import type { PaymentListItem } from "../types/payment.types";
import {
  getPendingPaymentForInvoice,
  getReservedPaymentTotal,
} from "./paymentTableHelpers";

type Props = {
  invoices: InvoiceListItem[];
  payments: PaymentListItem[];
};

export default function ApprovedInvoicesReadyForPaymentTable({
  invoices,
  payments,
}: Props) {
  if (invoices.length === 0) {
    return (
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Ready for First Payment
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Approved invoices that have not received a completed payment yet.
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <EmptyState message="No approved invoices are ready for payment." />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <div className="border-b p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Ready for First Payment
        </h2>
        <p className="mt-1 text-sm text-primary-gray">
          Approved invoices that have not received a completed payment yet and
          still have an outstanding balance.
        </p>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="min-w-[1050px] border-separate border-spacing-0 text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Invoice
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Supplier
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Invoice Total
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Reserved/Paid
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Balance Remaining
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Payment State
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => {
              const pendingPayment = getPendingPaymentForInvoice(
                invoice.id,
                payments,
              );

              const invoiceTotal = Number(invoice.total_amount ?? 0);
              const reservedTotal = getReservedPaymentTotal(
                invoice.id,
                payments,
              );
              const balanceRemaining = Math.max(
                invoiceTotal - reservedTotal,
                0,
              );
              const currency = invoice.currency ?? undefined;

              return (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="max-w-[220px] truncate border-b px-4 py-3 font-medium text-primary-black">
                    {invoice.invoice_number}
                  </td>
                  <td className="whitespace-nowrap border-b px-4 py-3 text-gray-700">
                    {invoice.supplier_name ?? "-"}
                  </td>
                  <td className="whitespace-nowrap border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(invoiceTotal, currency)}
                  </td>
                  <td className="whitespace-nowrap border-b px-4 py-3 text-right tabular-nums text-gray-700">
                    {formatCurrency(reservedTotal, currency)}
                  </td>
                  <td className="whitespace-nowrap border-b px-4 py-3 text-right tabular-nums font-semibold text-primary-black">
                    {formatCurrency(balanceRemaining, currency)}
                  </td>
                  <td className="whitespace-nowrap border-b px-4 py-3">
                    {pendingPayment ? (
                      <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                        Payment pending approval
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        Ready for payment
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap border-b px-4 py-3 text-right">
                    {pendingPayment ? (
                      <Link
                        to={`/payments/${pendingPayment.id}`}
                        className="font-medium text-yellow-700 hover:underline"
                      >
                        View Pending Payment
                      </Link>
                    ) : (
                      <Link
                        to={`/invoices/${invoice.id}/payments/new`}
                        className="font-medium text-primary-blue hover:underline"
                      >
                        Create Payment
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
