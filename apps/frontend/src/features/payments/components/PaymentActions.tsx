import axios from "axios";
import { useState } from "react";

import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import StatusBadge from "../../../components/ui/StatusBadge";
import { deletePayment, submitPayment } from "../api/paymentApi";
import type { PaymentDetails } from "../types/payment.types";
import { userHasPermission } from "../../../utils/permissions";

type PaymentActionsProps = {
  payment: PaymentDetails;
  onUpdated: (payment: PaymentDetails) => void;
  onDeleted?: () => void;
  onError: (message: string) => void;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return fallback;
}

export default function PaymentActions({
  payment,
  onUpdated,
  onDeleted,
  onError,
}: PaymentActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState("");

  const hasSubmitPermission = userHasPermission("payment.submit");
  const hasCancelPermission = userHasPermission("payment.cancel");

  const canSubmit =
    hasSubmitPermission &&
    (payment.status === "DRAFT" || payment.status === "REJECTED");

  const canDelete =
    hasCancelPermission &&
    (payment.status === "DRAFT" || payment.status === "REJECTED");
  const isSubmittedForApproval = payment.status === "PENDING_APPROVAL";

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setConfirmError("");

      const updatedPayment = await submitPayment(payment.id);
      onUpdated(updatedPayment);
    } catch (error) {
      onError(
        getApiErrorMessage(error, "Failed to submit payment for approval."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmDelete() {
    try {
      setIsDeleting(true);
      setConfirmError("");

      await deletePayment(payment.id);

      setShowDeleteConfirm(false);
      onDeleted?.();
    } catch (error) {
      setConfirmError(getApiErrorMessage(error, "Failed to delete payment."));
    } finally {
      setIsDeleting(false);
    }
  }
  const hasVisibleActions = isSubmittedForApproval || canSubmit || canDelete;

  if (!hasVisibleActions) {
    return null;
  }
  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete payment"
        message={`Delete payment for invoice "${
          payment.invoice_number ?? "this invoice"
        }"? This will only work if the payment is still draft or rejected and has not been submitted for approval.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
        errorMessage={confirmError}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setConfirmError("");
        }}
      />

      <div className="flex flex-wrap justify-end gap-2">
        {isSubmittedForApproval && (
          <StatusBadge variant="warning">
            Payment submitted for approval
          </StatusBadge>
        )}

        {canSubmit && (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isDeleting}
          >
            {isSubmitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        )}

        {canDelete && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isSubmitting || isDeleting}
          >
            Delete
          </Button>
        )}
      </div>
    </>
  );
}
