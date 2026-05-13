import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/ui/Button";
import { deleteInvoice, submitInvoice } from "../api/invoiceApi";
import type { InvoiceDetails } from "../types/invoice.types";

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
      return "This invoice was rejected. Resubmission can be added later.";
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
  const navigate = useNavigate();

  async function handleSubmitForApproval() {
    try {
      setSubmitting(true);
      onError("");

      const updatedInvoice = await submitInvoice(invoice.id);
      onUpdated(updatedInvoice);
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

  async function handleDeleteInvoice() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this draft invoice? This action cannot be undone.",
    );

    if (!confirmed) return;

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
    }
  }

  if (invoice.status !== "DRAFT") {
    const message = getReadOnlyMessage(invoice.status);
    const canCreatePayment =
      (invoice.status === "APPROVED" || invoice.status === "PARTIALLY_PAID") &&
      !hasPendingPayment;

    if (!message && !canCreatePayment) return null;

    return (
      <div className="flex flex-col gap-2">
        {hasPendingPayment ? (
          <div className="max-w-xs rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            A payment has already been created for this invoice and is pending
            approval.
          </div>
        ) : (
          <>
            {message && (
              <div className="max-w-xs rounded-lg border bg-gray-50 px-3 py-2 text-xs text-primary-gray">
                {message}
              </div>
            )}

            {canCreatePayment && (
              <Button
                type="button"
                onClick={() => navigate(`/invoices/${invoice.id}/payments/new`)}
              >
                Create Payment
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
      <Button
        type="button"
        onClick={handleSubmitForApproval}
        disabled={submitting || deleting}
      >
        {submitting ? "Submitting..." : "Submit for Approval"}
      </Button>

      <Button
        type="button"
        variant="danger"
        onClick={handleDeleteInvoice}
        disabled={deleting || submitting}
      >
        {deleting ? "Deleting..." : "Delete Draft"}
      </Button>
    </div>
  );
}
