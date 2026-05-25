import { useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import EmptyState from "../../../components/ui/EmptyState";
import MobileFloatingTableAction from "../../../components/ui/MobileFloatingTableAction";
import StatusBadge from "../../../components/ui/StatusBadge";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
  stickyRightCell,
  stickyRightHeader,
} from "../../../components/ui/tableStickyStyles";

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

export default function ApprovedInvoicesReadyForPaymentTable({
  invoices,
  payments,
}: Props) {
  const canCreatePayment = userHasPermission("payment.create");
  const [selectedMobileInvoice, setSelectedMobileInvoice] =
    useState<InvoiceListItem | null>(null);

  const selectedPendingPayment = selectedMobileInvoice
    ? getPendingPaymentForInvoice(selectedMobileInvoice.id, payments)
    : null;

  function toggleMobileActions(invoice: InvoiceListItem) {
    setSelectedMobileInvoice((current) =>
      current?.id === invoice.id ? null : invoice,
    );
  }

  if (invoices.length === 0) {
    return (
      <EmptyState
        title="No approved invoices ready"
        message="Approved invoices with an outstanding balance will appear here when they are ready for payment."
      />
    );
  }

  return (
    <>
      <TableWrapper minWidth="1050px">
        <table className="w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                className={`${stickyLeftHeader} px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray`}
              >
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
              <th
                className={`${stickyRightHeader} hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray lg:table-cell`}
              >
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
                <tr key={invoice.id} className="group hover:bg-gray-50">
                  <td
                    className={`${stickyLeftCell} whitespace-nowrap px-4 py-3 font-medium text-primary-black`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleMobileActions(invoice)}
                      className="block max-w-[220px] text-left lg:pointer-events-none"
                      title="Tap to show actions"
                    >
                      {invoice.invoice_number}
                    </button>
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
                      <StatusBadge variant="success">
                        Ready for payment
                      </StatusBadge>
                    )}
                  </td>

                  <td
                    className={`${stickyRightCell} hidden whitespace-nowrap px-4 py-3 text-right lg:table-cell`}
                  >
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
                          View Pending
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
                          Create Payment
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

      <MobileFloatingTableAction
        isOpen={Boolean(selectedMobileInvoice)}
        reference={selectedMobileInvoice?.invoice_number ?? ""}
        label="Selected approved invoice"
        onClose={() => setSelectedMobileInvoice(null)}
      >
        {selectedMobileInvoice && (
          <>
            {selectedPendingPayment ? (
              <Link
                to={`/payments/${selectedPendingPayment.id}`}
                state={{
                  from: "payments",
                  label: "Back to Payments",
                  to: "/payments",
                }}
              >
                <Button type="button" variant="secondary" size="sm">
                  View Pending
                </Button>
              </Link>
            ) : canCreatePayment ? (
              <Link
                to={`/invoices/${selectedMobileInvoice.id}/payments/new`}
                state={{
                  from: "payments",
                  label: "Back to Payments",
                  to: "/payments",
                }}
              >
                <Button type="button" variant="secondary" size="sm">
                  Create Payment
                </Button>
              </Link>
            ) : (
              <span className="text-sm text-primary-gray">
                No action available
              </span>
            )}
          </>
        )}
      </MobileFloatingTableAction>
    </>
  );
}
