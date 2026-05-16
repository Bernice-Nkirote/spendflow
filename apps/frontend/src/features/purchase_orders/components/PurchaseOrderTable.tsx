import { Link } from "react-router-dom";

import type { PurchaseOrderListItem } from "../types/purchaseOrder.types";
import PurchaseOrderStatusBadge from "./PurchaseOrderStatusBadge";

import { formatCurrency } from "../../../utils/formatCurrency";

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
  return (
    <div className="max-w-full overflow-x-auto rounded-xl border bg-white shadow-sm">
      <table className="min-w-[1000px] border-separate border-spacing-0 text-sm">
        <thead className="bg-gray-50 text-left">
          <tr>
            <th className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              PO Number
            </th>
            <th className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Supplier
            </th>
            <th className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Department
            </th>
            <th className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              PR Number
            </th>
            <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
              Original Amount
            </th>

            <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
              Base Amount
            </th>
            <th className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Status
            </th>
            <th className="border-b px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
              Created
            </th>
            <th className="border-b px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {purchaseOrders.map((po) => (
            <tr key={po.id} className="transition-colors hover:bg-gray-50">
              <td className="border-b px-4 py-3 font-medium text-primary-black">
                {po.po_number}
              </td>

              <td className="border-b px-4 py-3 text-gray-700">
                {po.supplier_name ?? "-"}
              </td>

              <td className="border-b px-4 py-3 text-gray-700">
                {po.department_name ?? "-"}
              </td>

              <td className="border-b px-4 py-3 text-gray-700">
                {po.pr_number ?? "Standalone"}
              </td>

              <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                <div className="font-medium">
                  {formatCurrency(Number(po.total_amount ?? 0), po.currency)}
                </div>

                <div className="text-xs text-primary-gray">{po.currency}</div>
              </td>

              <td className="border-b px-4 py-3 text-right tabular-nums text-gray-700">
                {po.base_amount && po.base_currency ? (
                  <>
                    <div className="font-medium">
                      {formatCurrency(Number(po.base_amount), po.base_currency)}
                    </div>

                    <div className="text-xs text-primary-gray">
                      Approval value
                    </div>
                  </>
                ) : (
                  <span className="text-primary-gray">-</span>
                )}
              </td>

              <td className="border-b px-4 py-3">
                <PurchaseOrderStatusBadge status={po.status} />
              </td>

              <td className="border-b px-4 py-3 text-gray-700">
                {formatDate(po.created_at)}
              </td>

              <td className="border-b px-4 py-3 text-right">
                <Link
                  to={`/purchase-orders/${po.id}`}
                  className="text-sm font-medium text-primary-blue hover:underline"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
