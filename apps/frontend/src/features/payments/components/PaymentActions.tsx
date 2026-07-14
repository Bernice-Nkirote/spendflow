import axios from "axios";
import { useState } from "react";

import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import StatusBadge from "../../../components/ui/StatusBadge";
import { deletePayment, recordPayment, submitPayment } from "../api/paymentApi";
import type { PaymentDetails, PaymentMethod } from "../types/payment.types";
import { userHasPermission } from "../../../utils/permissions";
import { refreshWorkQueues } from "../../../utils/refreshWorkQueues";

const paymentMethods: { label: string; value: PaymentMethod }[] = [
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "M-Pesa", value: "MPESA" },
  { label: "Cash", value: "CASH" },
];

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
  const [isRecording, setIsRecording] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRecordConfirm, setShowRecordConfirm] = useState(false);
  const [recordMethod, setRecordMethod] = useState<PaymentMethod>(
    payment.payment_method,
  );
  const [recordReference, setRecordReference] = useState(
    payment.reference ?? "",
  );
  const [confirmError, setConfirmError] = useState("");

  const hasSubmitPermission = userHasPermission("payment.submit");
  const hasCancelPermission = userHasPermission("payment.cancel");
  const hasRecordPermission = userHasPermission("payment.create");

  const canSubmit =
    hasSubmitPermission &&
    (payment.status === "DRAFT" || payment.status === "REJECTED");

  const canDelete =
    hasCancelPermission &&
    (payment.status === "DRAFT" || payment.status === "REJECTED");

  const canRecord = hasRecordPermission && payment.status === "APPROVED";
  const isSubmittedForApproval = payment.status === "PENDING_APPROVAL";

  async function handleSubmit() {
    try {
      setIsSubmitting(true);
      setConfirmError("");

      const updatedPayment = await submitPayment(payment.id);
      onUpdated(updatedPayment);
      refreshWorkQueues();
    } catch (error) {
      onError(
        getApiErrorMessage(error, "Failed to submit payment for approval."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRecordPayment() {
    if (
      (recordMethod === "BANK_TRANSFER" || recordMethod === "MPESA") &&
      !recordReference.trim()
    ) {
      setConfirmError(
        "Reference is required for Bank Transfer and M-Pesa payments.",
      );
      return;
    }

    try {
      setIsRecording(true);
      setConfirmError("");

      const updatedPayment = await recordPayment(payment.id, {
        payment_method: recordMethod,
        reference: recordReference.trim() || null,
      });

      setShowRecordConfirm(false);
      onUpdated(updatedPayment);
      refreshWorkQueues();
    } catch (error) {
      setConfirmError(getApiErrorMessage(error, "Failed to record payment."));
    } finally {
      setIsRecording(false);
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

  const hasVisibleActions =
    isSubmittedForApproval || canSubmit || canRecord || canDelete;

  if (!hasVisibleActions) {
    return null;
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showRecordConfirm}
        title="Record payment"
        message={
          <div className="space-y-4">
            <p>
              Use this after the approved payment has actually been made. Enter
              the final payment method and transaction reference.
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary-black">
                Payment Method
              </label>
              <select
                value={recordMethod}
                onChange={(event) =>
                  setRecordMethod(event.target.value as PaymentMethod)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
              >
                {paymentMethods.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-primary-black">
                Transaction Reference
              </label>
              <input
                type="text"
                value={recordReference}
                onChange={(event) => setRecordReference(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-primary-black outline-none transition placeholder:text-gray-400 focus:border-primary-blue focus:ring-2 focus:ring-primary-blue/20"
                placeholder="Example: BANK-REF-001 or MPESA-REF-001"
              />
              <p className="text-xs text-primary-gray">
                Required for Bank Transfer and M-Pesa payments.
              </p>
            </div>
          </div>
        }
        confirmLabel="Record Payment"
        variant="info"
        isLoading={isRecording}
        errorMessage={confirmError}
        onConfirm={handleRecordPayment}
        onCancel={() => {
          setShowRecordConfirm(false);
          setConfirmError("");
        }}
      />

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

        {canRecord && (
          <Button
            type="button"
            onClick={() => setShowRecordConfirm(true)}
            disabled={isRecording || isDeleting}
          >
            {isRecording ? "Recording..." : "Record Payment"}
          </Button>
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
