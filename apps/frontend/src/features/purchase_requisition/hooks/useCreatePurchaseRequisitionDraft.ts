import { useEffect, useRef, useState } from "react";

import type { PurchaseRequisitionItemCreate } from "../types/purchaseRequisition.types";

const CREATE_PR_DRAFT_KEY = "createPurchaseRequisitionDraft";

export type CreatePurchaseRequisitionDraft = {
  title: string;
  description: string;
  currency: string;
  departmentId: string;
  items: PurchaseRequisitionItemCreate[];
};

const defaultItems: PurchaseRequisitionItemCreate[] = [
  {
    item_name: "",
    description: "",
    quantity: "1",
    unit_price: "",
  },
];

type UseCreatePurchaseRequisitionDraftProps = {
  title: string;
  description: string;
  currency: string;
  departmentId: string;
  items: PurchaseRequisitionItemCreate[];
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setCurrency: (value: string) => void;
  setDepartmentId: (value: string) => void;
  setItems: (value: PurchaseRequisitionItemCreate[]) => void;
};

export function clearCreatePurchaseRequisitionDraft() {
  sessionStorage.removeItem(CREATE_PR_DRAFT_KEY);
}

export function useCreatePurchaseRequisitionDraft({
  title,
  description,
  currency,
  departmentId,
  items,
  setTitle,
  setDescription,
  setCurrency,
  setDepartmentId,
  setItems,
}: UseCreatePurchaseRequisitionDraftProps) {
  const [draftRestored, setDraftRestored] = useState(false);
  const settersRef = useRef({
    setTitle,
    setDescription,
    setCurrency,
    setDepartmentId,
    setItems,
  });

  useEffect(() => {
    const savedDraft = sessionStorage.getItem(CREATE_PR_DRAFT_KEY);

    if (!savedDraft) {
      setDraftRestored(true);
      return;
    }

    try {
      const parsedDraft = JSON.parse(
        savedDraft,
      ) as CreatePurchaseRequisitionDraft;

      settersRef.current.setTitle(parsedDraft.title || "");
      settersRef.current.setDescription(parsedDraft.description || "");
      settersRef.current.setCurrency(parsedDraft.currency || "KES");
      settersRef.current.setDepartmentId(parsedDraft.departmentId || "");
      settersRef.current.setItems(
        parsedDraft.items?.length ? parsedDraft.items : defaultItems,
      );
    } catch {
      clearCreatePurchaseRequisitionDraft();
    } finally {
      setDraftRestored(true);
    }
  }, []);

  useEffect(() => {
    if (!draftRestored) return;

    const draft: CreatePurchaseRequisitionDraft = {
      title,
      description,
      currency,
      departmentId,
      items,
    };

    sessionStorage.setItem(CREATE_PR_DRAFT_KEY, JSON.stringify(draft));
  }, [draftRestored, title, description, currency, departmentId, items]);
}
