import { useEffect, useState } from "react";

import type { PurchaseOrderItemCreate } from "../types/purchaseOrder.types";

const CREATE_PO_DRAFT_KEY = "createPurchaseOrderDraft";

export type CreatePurchaseOrderDraft = {
  supplierId: string;
  departmentId: string;
  currency: string;
  notes: string;
  items: PurchaseOrderItemCreate[];
};

const defaultItems: PurchaseOrderItemCreate[] = [
  {
    item_name: "",
    description: "",
    quantity: "1",
    unit_price: "0",
  },
];

type UseCreatePurchaseOrderDraftProps = {
  supplierId: string;
  departmentId: string;
  currency: string;
  notes: string;
  items: PurchaseOrderItemCreate[];
  setSupplierId: (value: string) => void;
  setDepartmentId: (value: string) => void;
  setCurrency: (value: string) => void;
  setNotes: (value: string) => void;
  setItems: (value: PurchaseOrderItemCreate[]) => void;
};

export function clearCreatePurchaseOrderDraft() {
  sessionStorage.removeItem(CREATE_PO_DRAFT_KEY);
}

export function useCreatePurchaseOrderDraft({
  supplierId,
  departmentId,
  currency,
  notes,
  items,
  setSupplierId,
  setDepartmentId,
  setCurrency,
  setNotes,
  setItems,
}: UseCreatePurchaseOrderDraftProps) {
  const [draftRestored, setDraftRestored] = useState(false);

  useEffect(() => {
    const savedDraft = sessionStorage.getItem(CREATE_PO_DRAFT_KEY);

    if (!savedDraft) {
      setDraftRestored(true);
      return;
    }

    try {
      const parsedDraft = JSON.parse(savedDraft) as CreatePurchaseOrderDraft;

      setSupplierId(parsedDraft.supplierId || "");
      setDepartmentId(parsedDraft.departmentId || "");
      setCurrency(parsedDraft.currency || "KES");
      setNotes(parsedDraft.notes || "");
      setItems(parsedDraft.items?.length ? parsedDraft.items : defaultItems);
    } catch {
      clearCreatePurchaseOrderDraft();
    } finally {
      setDraftRestored(true);
    }
  }, [setSupplierId, setDepartmentId, setCurrency, setNotes, setItems]);

  useEffect(() => {
    if (!draftRestored) return;

    const draft: CreatePurchaseOrderDraft = {
      supplierId,
      departmentId,
      currency,
      notes,
      items,
    };

    sessionStorage.setItem(CREATE_PO_DRAFT_KEY, JSON.stringify(draft));
  }, [draftRestored, supplierId, departmentId, currency, notes, items]);
}
