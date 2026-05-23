import { Link } from "react-router-dom";
import Button from "../../../components/ui/Button";
import TableWrapper from "../../../components/ui/TableWrapper";

import type { PurchaseRequisitionListItem } from "../types/purchaseRequisition.types";
import PurchaseRequisitionStatusBadge from "./PurchaseRequisitionStatusBadge";
import {
  formatCurrency,
  normalizeCurrencyCode,
} from "../../../utils/formatCurrency";

type Props = {
  purchaseRequisitions: PurchaseRequisitionListItem[];
};

function formatDate(value: string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function PurchaseRequisitionTable({
  purchaseRequisitions,
}: Props) {
  return (
    <TableWrapper minWidth="1000px">
      <table className="w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              PR Number
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Title
            </th>
            <th className="whitespace-nowrap px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Original Amount
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Base Amount
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Items
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Created
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-primary-gray">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {purchaseRequisitions.map((pr) => (
            <tr key={pr.id} className="transition hover:bg-gray-50">
              <td className="whitespace-nowrap px-4 py-3 font-medium text-primary-black">
                {pr.pr_number}
              </td>

              <td className="px-4 py-3 text-primary-black">
                <span className="block max-w-[220px] truncate" title={pr.title}>
                  {pr.title}
                </span>
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                <div className="font-medium">
                  {formatCurrency(Number(pr.total_amount ?? 0), pr.currency)}
                </div>
                <div className="text-xs text-primary-gray">
                  {normalizeCurrencyCode(pr.currency)}
                </div>
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                {pr.base_amount && pr.base_currency ? (
                  <>
                    <div className="font-medium">
                      {formatCurrency(Number(pr.base_amount), pr.base_currency)}
                    </div>
                    <div className="text-xs text-primary-gray">
                      Approval value
                    </div>
                  </>
                ) : (
                  <span className="text-primary-gray">-</span>
                )}
              </td>

              <td className="whitespace-nowrap px-4 py-3">
                <PurchaseRequisitionStatusBadge status={pr.status} />
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-right text-primary-black">
                {pr.items?.length ?? 0}
              </td>

              <td className="whitespace-nowrap px-4 py-3 text-primary-black">
                {formatDate(pr.created_at)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <div className="flex items-center gap-2">
                  <Link to={`/purchase-requisitions/${pr.id}`}>
                    <Button type="button" variant="secondary" size="sm">
                      View
                    </Button>
                  </Link>

                  {pr.status === "DRAFT" && (
                    <Link to={`/purchase-requisitions/${pr.id}/edit`}>
                      <Button type="button" variant="secondary" size="sm">
                        Edit
                      </Button>
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrapper>
  );
}
