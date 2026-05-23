import { useEffect, useRef, useState } from "react";

import type { PaymentMethod } from "../types/payment.types";

function getCreatePaymentDraftKey(invoiceId: string) {
  return `createPaymentDraft:${invoiceId}`;
}

type CreatePaymentDraft = {
  amount: string;
  paymentMethod: PaymentMethod;
  reference: string;
};

type UseCreatePaymentDraftProps = {
  invoiceId: string | undefined;
  isReady: boolean;
  amount: string;
  paymentMethod: PaymentMethod;
  reference: string;
  setAmount: (value: string) => void;
  setPaymentMethod: (value: PaymentMethod) => void;
  setReference: (value: string) => void;
};

export function clearCreatePaymentDraft(invoiceId: string) {
  sessionStorage.removeItem(getCreatePaymentDraftKey(invoiceId));
}

export function useCreatePaymentDraft({
  invoiceId,
  isReady,
  amount,
  paymentMethod,
  reference,
  setAmount,
  setPaymentMethod,
  setReference,
}: UseCreatePaymentDraftProps) {
  const [draftRestored, setDraftRestored] = useState(false);
  const restoredKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!invoiceId || !isReady) return;

    const draftKey = getCreatePaymentDraftKey(invoiceId);

    if (restoredKeyRef.current === draftKey) return;

    setDraftRestored(false);

    const savedDraft = sessionStorage.getItem(draftKey);

    if (!savedDraft) {
      restoredKeyRef.current = draftKey;
      setDraftRestored(true);
      return;
    }

    try {
      const parsedDraft = JSON.parse(savedDraft) as CreatePaymentDraft;

      setAmount(parsedDraft.amount || "");
      setPaymentMethod(parsedDraft.paymentMethod || "BANK_TRANSFER");
      setReference(parsedDraft.reference || "");
    } catch {
      sessionStorage.removeItem(draftKey);
    } finally {
      restoredKeyRef.current = draftKey;
      setDraftRestored(true);
    }
  }, [invoiceId, isReady, setAmount, setPaymentMethod, setReference]);

  useEffect(() => {
    if (!invoiceId || !isReady || !draftRestored) return;

    const draft: CreatePaymentDraft = {
      amount,
      paymentMethod,
      reference,
    };

    sessionStorage.setItem(
      getCreatePaymentDraftKey(invoiceId),
      JSON.stringify(draft),
    );
  }, [invoiceId, isReady, draftRestored, amount, paymentMethod, reference]);
}
