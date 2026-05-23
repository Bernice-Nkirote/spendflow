import { useEffect, useRef, useState } from "react";

import type { InvoiceLineItemCreate } from "../types/invoice.types";

function getCreateInvoiceDraftKey(purchaseOrderId: string) {
  return `createInvoiceDraft:${purchaseOrderId}`;
}

type CreateInvoiceDraft = {
  invoiceNumber: string;
  lineItems: InvoiceLineItemCreate[];
};

type UseCreateInvoiceDraftProps = {
  purchaseOrderId: string | null;
  isReady: boolean;
  invoiceNumber: string;
  lineItems: InvoiceLineItemCreate[];
  setInvoiceNumber: (value: string) => void;
  setLineItems: (value: InvoiceLineItemCreate[]) => void;
};

export function clearCreateInvoiceDraft(purchaseOrderId: string) {
  sessionStorage.removeItem(getCreateInvoiceDraftKey(purchaseOrderId));
}

export function useCreateInvoiceDraft({
  purchaseOrderId,
  isReady,
  invoiceNumber,
  lineItems,
  setInvoiceNumber,
  setLineItems,
}: UseCreateInvoiceDraftProps) {
  const [draftRestored, setDraftRestored] = useState(false);
  const restoredKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!purchaseOrderId || !isReady) return;

    const draftKey = getCreateInvoiceDraftKey(purchaseOrderId);

    if (restoredKeyRef.current === draftKey) return;

    setDraftRestored(false);

    const savedDraft = sessionStorage.getItem(draftKey);

    if (!savedDraft) {
      restoredKeyRef.current = draftKey;
      setDraftRestored(true);
      return;
    }

    try {
      const parsedDraft = JSON.parse(savedDraft) as CreateInvoiceDraft;

      setInvoiceNumber(parsedDraft.invoiceNumber || "");

      if (parsedDraft.lineItems?.length) {
        setLineItems(parsedDraft.lineItems);
      }
    } catch {
      sessionStorage.removeItem(draftKey);
    } finally {
      restoredKeyRef.current = draftKey;
      setDraftRestored(true);
    }
  }, [purchaseOrderId, isReady, setInvoiceNumber, setLineItems]);

  useEffect(() => {
    if (!purchaseOrderId || !isReady || !draftRestored) return;

    const draft: CreateInvoiceDraft = {
      invoiceNumber,
      lineItems,
    };

    sessionStorage.setItem(
      getCreateInvoiceDraftKey(purchaseOrderId),
      JSON.stringify(draft),
    );
  }, [purchaseOrderId, isReady, draftRestored, invoiceNumber, lineItems]);
}
