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
import type { PurchaseOrderListItem } from "../types/purchaseOrder.types";
import PurchaseOrderStatusBadge from "./PurchaseOrderStatusBadge";

type PurchaseOrderTableProps = {
  purchaseOrders: PurchaseOrderListItem[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export default function PurchaseOrderTable({
  purchaseOrders,
}: PurchaseOrderTableProps) {
  const [selectedMobilePo, setSelectedMobilePo] =
    useState<PurchaseOrderListItem | null>(null);

  function toggleMobileActions(po: PurchaseOrderListItem) {
    setSelectedMobilePo((current) => (current?.id === po.id ? null : po));
  }

  return (
    <>
      <TableWrapper minWidth="1100px">
        <table className="w-full divide-y divide-gray-200 bg-white text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th
                className={`${stickyLeftHeader} px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray`}
              >
                PO Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Supplier
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                Department
              </th>
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
                PR Number
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
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="group hover:bg-gray-50">
                <td
                  className={`${stickyLeftCell} px-4 py-3 font-medium text-primary-black`}
                >
                  <button
                    type="button"
                    onClick={() => toggleMobileActions(po)}
                    className="block max-w-[260px] break-words text-left lg:pointer-events-none"
                    title="Tap to show actions"
                  >
                    {po.po_number}
                  </button>
                </td>

                <td className="px-4 py-3 text-primary-black">
                  {po.supplier_name ?? "-"}
                </td>

                <td className="px-4 py-3 text-primary-black">
                  {po.department_name ?? "-"}
                </td>

                <td className="px-4 py-3 text-primary-black">
                  {po.pr_number ?? "Standalone"}
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                  <div className="font-medium">
                    {formatCurrency(Number(po.total_amount ?? 0), po.currency)}
                  </div>
                  <div className="text-xs text-primary-gray">{po.currency}</div>
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                  {po.base_amount && po.base_currency ? (
                    <>
                      <div className="font-medium">
                        {formatCurrency(
                          Number(po.base_amount),
                          po.base_currency,
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
                  <PurchaseOrderStatusBadge status={po.status} />
                </td>

                <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                  {formatDate(po.created_at)}
                </td>

                <td
                  className={`${stickyRightCell} hidden px-4 py-3 text-right lg:table-cell`}
                >
                  <Link to={`/purchase-orders/${po.id}`}>
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
        isOpen={Boolean(selectedMobilePo)}
        reference={selectedMobilePo?.po_number ?? ""}
        label="Selected purchase order"
        onClose={() => setSelectedMobilePo(null)}
      >
        {selectedMobilePo && (
          <Link to={`/purchase-orders/${selectedMobilePo.id}`}>
            <Button type="button" variant="secondary" size="sm">
              View Purchase Order
            </Button>
          </Link>
        )}
      </MobileFloatingTableAction>
    </>
  );
}
