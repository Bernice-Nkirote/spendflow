import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import TableWrapper from "../../../components/ui/TableWrapper";
import { formatCurrency } from "../../../utils/formatCurrency";
import type { PaymentListItem } from "../types/payment.types";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { formatDate, formatPaymentMethod } from "./paymentTableHelpers";

type Props = {
  payments: PaymentListItem[];
};

export default function PaymentRecordsTable({ payments }: Props) {
  return (
    <TableWrapper minWidth="1100px">
      <table className="w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Invoice
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Supplier
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Original Amount
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Base Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Method
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Reference
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Created By
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Status
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Created At
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {payments.map((payment) => (
            <tr key={payment.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                {payment.invoice_number ?? "-"}
              </td>

              <td className="px-4 py-3 text-primary-black">
                {payment.supplier_name ?? "Unknown supplier"}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
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

              <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
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

              <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                {formatPaymentMethod(payment.payment_method)}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                {payment.reference ?? "-"}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                {payment.created_by_name ?? "-"}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                <PaymentStatusBadge status={payment.status} />
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                {formatDate(payment.created_at)}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-right">
                <Link to={`/payments/${payment.id}`}>
                  <Button type="button" variant="secondary" size="sm">
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}
