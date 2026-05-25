import { useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import MobileFloatingTableAction from "../../../components/ui/MobileFloatingTableAction";
import TableWrapper from "../../../components/ui/TableWrapper";
import {
  stickyLeftCell,
  stickyLeftHeader,
  stickyRightCell,
  stickyRightHeader,
} from "../../../components/ui/tableStickyStyles";

import { formatCurrency } from "../../../utils/formatCurrency";
import InvoiceStatusBadge from "./InvoiceStatusBadge";
import type { InvoiceListItem } from "../types/invoice.types";

type InvoiceTableProps = {
  invoices: InvoiceListItem[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function getSubmittedBy(invoice: InvoiceListItem) {
  return (
    invoice.submitted_by_user_name ??
    invoice.submitted_by_supplier_user_name ??
    "-"
  );
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const [selectedMobileInvoice, setSelectedMobileInvoice] =
    useState<InvoiceListItem | null>(null);

  function toggleMobileActions(invoice: InvoiceListItem) {
    setSelectedMobileInvoice((current) =>
      current?.id === invoice.id ? null : invoice,
    );
  }

  return (
    <>
      <TableWrapper minWidth="1100px">
        <table className="w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                className={`${stickyLeftHeader} whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray`}
              >
                Invoice Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Supplier
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                PO Number
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Submitted By
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Original Amount
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Base Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Created
              </th>
              <th
                className={`${stickyRightHeader} hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray lg:table-cell`}
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="group hover:bg-gray-50">
                <td
                  className={`${stickyLeftCell} px-4 py-3 font-medium text-primary-black`}
                >
                  <button
                    type="button"
                    onClick={() => toggleMobileActions(invoice)}
                    className="block max-w-[220px] truncate text-left lg:pointer-events-none"
                    title="Tap to show actions"
                  >
                    {invoice.invoice_number}
                  </button>
                </td>

                <td className="px-4 py-3 text-primary-black">
                  {invoice.supplier_name ?? "Unknown supplier"}
                </td>

                <td className="px-4 py-3 text-primary-black">
                  {invoice.po_number ?? "-"}
                </td>

                <td className="px-4 py-3 text-primary-black">
                  {getSubmittedBy(invoice)}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                  <div className="font-medium">
                    {formatCurrency(
                      Number(invoice.total_amount ?? 0),
                      invoice.currency ?? undefined,
                    )}
                  </div>

                  <div className="text-xs text-primary-gray">
                    {invoice.currency ?? "-"}
                  </div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                  {invoice.base_amount && invoice.base_currency ? (
                    <>
                      <div className="font-medium">
                        {formatCurrency(
                          Number(invoice.base_amount),
                          invoice.base_currency,
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

                <td className="px-4 py-3">
                  <InvoiceStatusBadge status={invoice.status} />
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                  {formatDate(invoice.created_at)}
                </td>

                <td
                  className={`${stickyRightCell} hidden px-4 py-3 text-right lg:table-cell`}
                >
                  <Link to={`/invoices/${invoice.id}`}>
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

      <MobileFloatingTableAction
        isOpen={Boolean(selectedMobileInvoice)}
        reference={selectedMobileInvoice?.invoice_number ?? ""}
        label="Selected invoice"
        onClose={() => setSelectedMobileInvoice(null)}
      >
        {selectedMobileInvoice && (
          <Link to={`/invoices/${selectedMobileInvoice.id}`}>
            <Button type="button" variant="secondary" size="sm">
              View Invoice
            </Button>
          </Link>
        )}
      </MobileFloatingTableAction>
    </>
  );
}
