import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";

import { deleteInvoice, submitInvoice } from "../api/invoiceApi";
import type { InvoiceDetails } from "../types/invoice.types";

import { userHasPermission } from "../../../utils/permissions";
import { refreshWorkQueues } from "../../../utils/refreshWorkQueues";

type Props = {
  invoice: InvoiceDetails;
  hasPendingPayment?: boolean;
  onUpdated: (invoice: InvoiceDetails) => void;
  onError: (message: string) => void;
};

function getReadOnlyMessage(status: InvoiceDetails["status"]) {
  switch (status) {
    case "PENDING_APPROVAL":
      return "This invoice is pending approval.";

    case "APPROVED":
      return "This invoice has been approved and is ready for payment.";

    case "REJECTED":
      return "This invoice was rejected.";

    case "CANCELLED":
      return "This invoice has been cancelled.";

    case "PARTIALLY_PAID":
      return "This invoice has been partially paid.";

    case "PAID":
      return "This invoice has been fully paid.";

    case "SENT":
      return "This invoice has been sent.";

    default:
      return null;
  }
}

export default function InvoiceActions({
  invoice,
  hasPendingPayment = false,
  onUpdated,
  onError,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const navigate = useNavigate();
  const canSubmitInvoice = userHasPermission("invoice.submit");
  const canCancelInvoice = userHasPermission("invoice.cancel");
  const canCreatePayment = userHasPermission("payment.create");

  async function handleSubmitForApproval() {
    try {
      setSubmitting(true);
      onError("");

      const updatedInvoice = await submitInvoice(invoice.id);
      onUpdated(updatedInvoice);
      refreshWorkQueues();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        onError(
          error.response?.data?.detail ??
            "Failed to submit invoice for approval.",
        );
      } else {
        onError("Failed to submit invoice for approval.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDeleteInvoice() {
    try {
      setDeleting(true);
      onError("");

      await deleteInvoice(invoice.id);

      navigate("/invoices");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        onError(
          error.response?.data?.detail ?? "Failed to delete draft invoice.",
        );
      } else {
        onError("Failed to delete draft invoice.");
      }
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  if (invoice.status !== "DRAFT") {
    const message = getReadOnlyMessage(invoice.status);

    const canCreatePaymentAction =
      canCreatePayment &&
      (invoice.status === "APPROVED" || invoice.status === "PARTIALLY_PAID") &&
      !hasPendingPayment;

    if (!message && !canCreatePaymentAction) {
      return null;
    }

    return (
      <>
        <div className="flex flex-col items-start gap-3 lg:items-end">
          {hasPendingPayment ? (
            <div className="max-w-md rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
              A payment has already been created for this invoice and is pending
              approval.
            </div>
          ) : (
            <>
              {message && (
                <div className="max-w-md rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {message}
                </div>
              )}

              {canCreatePaymentAction && (
                <Button
                  type="button"
                  onClick={() =>
                    navigate(`/invoices/${invoice.id}/payments/new`)
                  }
                >
                  Create Payment
                </Button>
              )}
            </>
          )}
        </div>
      </>
    );
  }
  const hasDraftActions = canSubmitInvoice || canCancelInvoice;

  if (!hasDraftActions) {
    return null;
  }

  return (
    <>
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete draft invoice"
        message="Delete this draft invoice? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
        onConfirm={confirmDeleteInvoice}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
        <p className="text-sm text-primary-gray">
          Available actions for this draft invoice.
        </p>

        {canSubmitInvoice && (
          <Button
            type="button"
            onClick={handleSubmitForApproval}
            disabled={submitting || deleting}
            className="w-full sm:w-auto"
          >
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        )}

        {canCancelInvoice && (
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting || submitting}
            className="w-full sm:w-auto"
          >
            {deleting ? "Deleting..." : "Delete Draft"}
          </Button>
        )}
      </div>
    </>
  );
}
