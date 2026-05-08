import { useState } from "react";
import { Link } from "react-router-dom";

import Button from "../../../components/ui/Button";
import {
  downloadPurchaseOrderPdf,
  submitPurchaseOrder,
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
    </div>
  );
}
