import Button from "../../../components/ui/Button";
import { deletePayment, submitPayment } from "../api/paymentApi";
import type { PaymentDetails } from "../types/payment.types";

type PaymentActionsProps = {
  payment: PaymentDetails;
  onUpdated: (payment: PaymentDetails) => void;
  onDeleted?: () => void;
  onError: (message: string) => void;
};

export default function PaymentActions({
  payment,
  onUpdated,
  onDeleted,
  onError,
}: PaymentActionsProps) {
  const canSubmit = payment.status === "DRAFT" || payment.status === "REJECTED";

  const canDelete = payment.status === "DRAFT" || payment.status === "REJECTED";
  const isSubmittedForApproval = payment.status === "PENDING_APPROVAL";

  async function handleSubmit() {
    try {
      const updatedPayment = await submitPayment(payment.id);
      onUpdated(updatedPayment);
    } catch {
      onError("Failed to submit payment for approval.");
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this payment?",
    );

    if (!confirmed) return;

    try {
      await deletePayment(payment.id);
      onDeleted?.();
    } catch {
      onError("Failed to delete payment.");
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isSubmittedForApproval && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
          Payment submitted for approval and awaiting review.
        </div>
      )}

      {canSubmit && (
        <Button type="button" onClick={handleSubmit}>
          Submit for Approval
        </Button>
      )}

      {canDelete && (
        <Button type="button" variant="secondary" onClick={handleDelete}>
          Delete
        </Button>
      )}
    </div>
  );
}
