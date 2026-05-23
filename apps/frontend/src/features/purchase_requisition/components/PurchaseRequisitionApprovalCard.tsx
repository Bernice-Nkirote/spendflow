import Card from "../../../components/ui/Card";
import PurchaseRequisitionStatusBadge from "./PurchaseRequisitionStatusBadge";

import type { PurchaseRequisitionDetails } from "../types/purchaseRequisition.types";

type Props = {
  purchaseRequisition: PurchaseRequisitionDetails;
};

export default function PurchaseRequisitionApprovalCard({
  purchaseRequisition,
}: Props) {
  const status = purchaseRequisition.status;

  const contentByStatus = {
    DRAFT: {
      title: "Draft Purchase Requisition",
      message:
        "This PR has not been submitted for approval yet. Review the details and requested items, then submit it for approval when ready.",
      note: "Approval will only work after an active PR approval workflow has been configured.",
    },
    PENDING_APPROVAL: {
      title: "Pending Approval",
      message:
        "This PR has been submitted and is waiting for approval from the assigned approver level.",
      note: null,
    },
    APPROVED: {
      title: "Approved Purchase Requisition",
      message:
        "This PR has been approved and can now be used to create a purchase order.",
      note: null,
    },
    REJECTED: {
      title: "Rejected Purchase Requisition",
      message:
        "This PR was rejected. Review the feedback, update the PR if allowed, and resubmit if supported.",
      note: null,
    },
    CANCELLED: {
      title: "Cancelled Purchase Requisition",
      message:
        "This PR has been cancelled and should not continue in the workflow.",
      note: null,
    },
    CONVERTED_TO_PO: {
      title: "Converted to Purchase Order",
      message:
        "This PR has already been converted into a purchase order and is no longer editable.",
      note: null,
    },
  };

  const content = contentByStatus[status];

  return (
    <Card className="p-4 shadow-md sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-primary-black">
            {content.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-primary-gray">
            {content.message}
          </p>
        </div>

        <PurchaseRequisitionStatusBadge status={status} />
      </div>

      {content.note && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm font-medium text-yellow-800">
          {content.note}
        </div>
      )}
    </Card>
  );
}
