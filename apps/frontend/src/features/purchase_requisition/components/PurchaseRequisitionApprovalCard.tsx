import type { PurchaseRequisitionDetails } from "../types/purchaseRequisition.types";

type Props = {
  purchaseRequisition: PurchaseRequisitionDetails;
};

export default function PurchaseRequisitionApprovalCard({
  purchaseRequisition,
}: Props) {
  const status = purchaseRequisition.status;

  let title = "Approval Status";
  let message =
    "This purchase requisition is being tracked through its workflow.";

  if (status === "DRAFT") {
    title = "Draft Purchase Requisition";
    message =
      "This PR has not been submitted for approval yet. Review the details and items, then submit it for approval when ready.";
  }

  if (status === "PENDING_APPROVAL") {
    title = "Pending Approval";
    message =
      "This PR has been submitted and is waiting for approval from the assigned approver level.";
  }

  if (status === "APPROVED") {
    title = "Approved Purchase Requisition";
    message =
      "This PR has been approved and can now be used to create a purchase order.";
  }

  if (status === "REJECTED") {
    title = "Rejected Purchase Requisition";
    message =
      "This PR was rejected. Review the feedback, update the draft if allowed, and resubmit if supported.";
  }

  if (status === "CANCELLED") {
    title = "Cancelled Purchase Requisition";
    message =
      "This PR has been cancelled and should not continue in the workflow.";
  }

  if (status === "CONVERTED_TO_PO") {
    title = "Converted to Purchase Order";
    message =
      "This PR has already been converted into a purchase order and is no longer editable.";
  }

  return (
    <section className="rounded-xl border bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-lg font-semibold text-primary-black">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-primary-gray">{message}</p>

      {status === "DRAFT" && (
        <p className="mt-3 text-sm font-medium text-yellow-700">
          Approval will only work after an active PR approval workflow has been
          configured.
        </p>
      )}
    </section>
  );
}
