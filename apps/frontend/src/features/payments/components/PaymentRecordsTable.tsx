import { Link } from "react-router-dom";

import EmptyState from "../../../components/ui/EmptyState";
import { formatCurrency } from "../../../utils/formatCurrency";
import PaymentStatusBadge from "./PaymentStatusBadge";
import type { PaymentListItem } from "../types/payment.types";
import { formatDate, formatPaymentMethod } from "./paymentTableHelpers";

type Props = {
  payments: PaymentListItem[];
};

export default function PaymentRecordsTable({ payments }: Props) {
  if (payments.length === 0) {
    return (
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="border-b p-4 sm:p-5">
          <h2 className="text-lg font-semibold text-primary-black">
            Payment Records
          </h2>
          <p className="mt-1 text-sm text-primary-gray">
            Payments already created against invoices.
          </p>
        </div>

        <div className="p-4 sm:p-5">
          <EmptyState message="No payments have been created yet." />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border bg-white shadow-sm">
      <div className="border-b p-4 sm:p-5">
        <h2 className="text-lg font-semibold text-primary-black">
          Payment Records
        </h2>
        <p className="mt-1 text-sm text-primary-gray">
          Track created payments, approval status, method, reference, and
          creator.
        </p>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="min-w-[1000px] border-separate border-spacing-0 text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Invoice
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Supplier
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Original Amount
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Base Amount
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Method
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Reference
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Created By
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Status
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                Created At
              </th>
              <th className="whitespace-nowrap border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="max-w-[220px] truncate border-b px-4 py-3 font-medium text-primary-black">
                  {payment.invoice_number ?? "-"}
                </td>
                <td className="whitespace-nowrap border-b px-4 py-3 text-gray-700">
                  {payment.supplier_name ?? "-"}
                </td>
                <td className="whitespace-nowrap border-b px-4 py-3 text-right tabular-nums text-gray-700">
                  <div className="font-medium">
                    {formatCurrency(
                      Number(payment.amount ?? 0),
                      payment.currency ?? undefined,
                    )}
                  </div>

                  <div className="text-xs text-primary-gray">
                    {payment.currency ?? "-"}
                  </div>
                </td>

                <td className="whitespace-nowrap border-b px-4 py-3 text-right tabular-nums text-gray-700">
                  {payment.base_amount && payment.base_currency ? (
                    <>
                      <div className="font-medium">
                        {formatCurrency(
                          Number(payment.base_amount),
                          payment.base_currency,
                        )}
                      </div>

                      <div className="text-xs text-primary-gray">
                        Approval value
                      </div>
                    </>
                  ) : (
                    <span className="text-primary-gray">-</span>
                  )}
                </td>
                <td className="whitespace-nowrap border-b px-4 py-3 text-gray-700">
                  {formatPaymentMethod(payment.payment_method)}
                </td>
                <td className="whitespace-nowrap border-b px-4 py-3 text-gray-700">
                  {payment.reference ?? "-"}
                </td>
                <td className="whitespace-nowrap border-b px-4 py-3 text-gray-700">
                  {payment.created_by_name ?? "-"}
                </td>
                <td className="whitespace-nowrap border-b px-4 py-3">
                  <PaymentStatusBadge status={payment.status} />
                </td>
                <td className="whitespace-nowrap border-b px-4 py-3 text-gray-700">
                  {formatDate(payment.created_at)}
                </td>
                <td className="whitespace-nowrap border-b px-4 py-3 text-right">
                  <Link
                    to={`/payments/${payment.id}`}
                    className="font-medium text-primary-blue hover:underline"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
