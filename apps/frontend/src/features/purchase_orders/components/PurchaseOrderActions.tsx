import { type ChangeEvent, useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
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

export default function PurchaseOrderActions({
  purchaseOrder,
  onUpdated,
  onError,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleSubmitForApproval() {
    try {
      setSubmitting(true);
      onError("");

      const updatedPurchaseOrder = await submitPurchaseOrder(purchaseOrder.id);
      onUpdated(updatedPurchaseOrder);
    } catch {
      onError("Failed to submit purchase order for approval.");
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
    } catch {
      onError("Failed to download purchase order PDF.");
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
    } catch {
      onError("Failed to upload signed purchase order PDF.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleSendToSupplier() {
    const confirmed = window.confirm(
      "Please confirm the supplier email is correct before dispatching this signed purchase order.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setSending(true);
      onError("");

      const updatedPurchaseOrder = await sendPurchaseOrderToSupplier(
        purchaseOrder.id,
      );

      onUpdated(updatedPurchaseOrder);
    } catch {
      onError("Failed to send signed purchase order to supplier.");
    } finally {
      setSending(false);
    }
  }

  const canDownloadPdf =
    purchaseOrder.status === "APPROVED" || purchaseOrder.status === "SENT";

  if (purchaseOrder.status !== "DRAFT" && !canDownloadPdf) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
      {purchaseOrder.status === "DRAFT" && (
        <>
          <Link to={`/purchase-orders/${purchaseOrder.id}/edit`}>
            <Button type="button" variant="secondary">
              Edit PO
            </Button>
          </Link>

          <Button
            type="button"
            onClick={handleSubmitForApproval}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
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

      {purchaseOrder.status === "APPROVED" && (
        <>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-primary-black transition hover:bg-gray-50">
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
            onClick={handleSendToSupplier}
            disabled={sending || !purchaseOrder.signed_pdf_file_path}
          >
            {sending ? "Sending..." : "Send to Supplier"}
          </Button>
        </>
      )}
    </div>
  );
}
