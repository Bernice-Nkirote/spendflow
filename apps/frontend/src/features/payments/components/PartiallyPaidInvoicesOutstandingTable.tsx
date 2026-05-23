import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import StatusBadge from "../../../components/ui/StatusBadge";
import TableWrapper from "../../../components/ui/TableWrapper";
import { formatCurrency } from "../../../utils/formatCurrency";
import { userHasPermission } from "../../../utils/permissions";
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

export default function PartiallyPaidInvoicesOutstandingTable({
  invoices,
  payments,
}: Props) {
  const canCreatePayment = userHasPermission("payment.create");

  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No outstanding partially paid invoices"
        message="Partially paid invoices with a remaining balance will appear here."
      />
    );
  }

  return (
    <TableWrapper minWidth="1050px">
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
              Invoice Total
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Reserved/Paid
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Balance Remaining
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Payment State
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {invoices.map((invoice) => {
            const pendingPayment = getPendingPaymentForInvoice(
              invoice.id,
              payments,
            );

            const invoiceTotal = Number(invoice.total_amount ?? 0);
            const reservedTotal = getReservedPaymentTotal(invoice.id, payments);
            const balanceRemaining = Math.max(invoiceTotal - reservedTotal, 0);
            const currency = invoice.currency ?? undefined;

            return (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                  {invoice.invoice_number}
                </td>

                <td className="px-4 py-3 text-primary-black">
                  {invoice.supplier_name ?? "Unknown supplier"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                  {formatCurrency(invoiceTotal, currency)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                  {formatCurrency(reservedTotal, currency)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-primary-black">
                  {formatCurrency(balanceRemaining, currency)}
                </td>

                <td className="px-4 py-3">
                  {pendingPayment ? (
                    <StatusBadge variant="warning">
                      Payment pending approval
                    </StatusBadge>
                  ) : (
                    <StatusBadge variant="danger">
                      Outstanding balance
                    </StatusBadge>
                  )}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right">
                  {pendingPayment ? (
                    <Link
                      to={`/payments/${pendingPayment.id}`}
                      state={{
                        from: "payments",
                        label: "Back to Payments",
                        to: "/payments",
                      }}
                    >
                      <Button type="button" variant="secondary" size="sm">
                        View Submitted
                      </Button>
                    </Link>
                  ) : canCreatePayment ? (
                    <Link
                      to={`/invoices/${invoice.id}/payments/new`}
                      state={{
                        from: "payments",
                        label: "Back to Payments",
                        to: "/payments",
                      }}
                    >
                      <Button type="button" variant="secondary" size="sm">
                        Continue Payment
                      </Button>
                    </Link>
                  ) : (
                    <span className="text-sm text-primary-gray">
                      No action available
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </TableWrapper>
  );
}
