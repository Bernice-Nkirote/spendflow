import axios from "axios";
import { type ChangeEvent, useState } from "react";
import { Link } from "react-router-dom";

import { userHasPermission } from "../../../utils/permissions";

import Button from "../../../components/ui/Button";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import {
  downloadPurchaseOrderPdf,
  sendPurchaseOrderToSupplier,
  submitPurchaseOrder,
  uploadSignedPurchaseOrderPdf,
} from "../api/purchaseOrderApi";
import type { PurchaseOrderDetails } from "../types/purchaseOrder.types";

type Props = {
  purchaseOrder: PurchaseOrderDetails;
  onUpdated: (purchaseOrder: PurchaseOrderDetails) => void;
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

export default function PurchaseOrderActions({
  purchaseOrder,
  onUpdated,
  onError,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  const canUpdatePO = userHasPermission("po.update");
  const canSubmitPO = userHasPermission("po.submit");
  const canDispatchPO = userHasPermission("po.dispatch");

  async function handleSubmitForApproval() {
    try {
      setSubmitting(true);
      onError("");

      const updatedPurchaseOrder = await submitPurchaseOrder(purchaseOrder.id);
      onUpdated(updatedPurchaseOrder);
    } catch (error) {
      onError(
        getApiErrorMessage(
          error,
          "Failed to submit purchase order for approval.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownloadPdf() {
    try {
      setDownloading(true);
      onError("");

      const pdfBlob = await downloadPurchaseOrderPdf(purchaseOrder.id);
      const fileUrl = window.URL.createObjectURL(pdfBlob);

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = `${purchaseOrder.po_number}.pdf`;
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      onError(
        getApiErrorMessage(error, "Failed to download purchase order PDF."),
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleUploadSignedPdf(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      onError("Please upload a PDF file.");
      return;
    }

    try {
      setUploading(true);
      onError("");

      const updatedPurchaseOrder = await uploadSignedPurchaseOrderPdf(
        purchaseOrder.id,
        file,
      );

      onUpdated(updatedPurchaseOrder);
    } catch (error) {
      onError(
        getApiErrorMessage(
          error,
          "Failed to upload signed purchase order PDF.",
        ),
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSendToSupplier() {
    try {
      setSending(true);
      onError("");

      const updatedPurchaseOrder = await sendPurchaseOrderToSupplier(
        purchaseOrder.id,
      );

      onUpdated(updatedPurchaseOrder);
      setIsSendDialogOpen(false);
    } catch (error) {
      onError(
        getApiErrorMessage(
          error,
          "Failed to send signed purchase order to supplier.",
        ),
      );
    } finally {
      setSending(false);
    }
  }

  const canDownloadPdf =
    purchaseOrder.status === "APPROVED" || purchaseOrder.status === "SENT";

  const hasVisibleDraftActions =
    purchaseOrder.status === "DRAFT" && (canUpdatePO || canSubmitPO);

  const hasVisibleDispatchActions =
    purchaseOrder.status === "APPROVED" && canDispatchPO;

  const hasVisibleActions =
    hasVisibleDraftActions || canDownloadPdf || hasVisibleDispatchActions;

  if (!hasVisibleActions) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        {purchaseOrder.status === "DRAFT" && (
          <>
            {canUpdatePO && (
              <Link to={`/purchase-orders/${purchaseOrder.id}/edit`}>
                <Button type="button" variant="secondary">
                  Edit PO
                </Button>
              </Link>
            )}

            {canSubmitPO && (
              <Button
                type="button"
                onClick={handleSubmitForApproval}
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit for Approval"}
              </Button>
            )}
          </>
        )}

        {canDownloadPdf && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleDownloadPdf}
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>
        )}

        {purchaseOrder.status === "APPROVED" && canDispatchPO && (
          <>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-primary-black transition hover:bg-gray-50 focus-within:ring-2 focus-within:ring-primary-blue/20">
              {uploading ? "Uploading..." : "Upload Signed PDF"}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleUploadSignedPdf}
                disabled={uploading}
              />
            </label>

            <Button
              type="button"
              onClick={() => setIsSendDialogOpen(true)}
              disabled={sending || !purchaseOrder.signed_pdf_file_path}
            >
              {sending ? "Sending..." : "Send to Supplier"}
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={isSendDialogOpen}
        title="Send purchase order to supplier?"
        message={
          <div className="space-y-4">
            <p>
              Please confirm the supplier details below before dispatching this
              signed purchase order. This action will send the signed PO
              document to the supplier.
            </p>

            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="space-y-3 text-sm">
                <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                  <span className="font-medium text-primary-gray">
                    Supplier Name
                  </span>
                  <span className="break-words font-semibold text-primary-blue">
                    {purchaseOrder.supplier_name ?? "Not available"}
                  </span>
                </div>

                <div className="border-t border-blue-100 pt-3">
                  <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                    <span className="font-medium text-primary-gray">
                      Supplier Email
                    </span>
                    <span className="break-words font-semibold text-primary-blue">
                      {purchaseOrder.supplier_email ?? "Not available"}
                    </span>
                  </div>
                </div>

                <div className="border-t border-blue-100 pt-3">
                  <div className="grid gap-1 sm:grid-cols-[140px_1fr]">
                    <span className="font-medium text-primary-gray">
                      PO Number
                    </span>
                    <span className="break-words font-semibold text-primary-blue">
                      {purchaseOrder.po_number}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-primary-gray">
              Kindly verify that the details above are correct before
              proceeding.
            </p>
          </div>
        }
        confirmLabel="Send PO"
        cancelLabel="Cancel"
        variant="info"
        isLoading={sending}
        onConfirm={handleSendToSupplier}
        onCancel={() => setIsSendDialogOpen(false)}
      />
    </>
  );
}
