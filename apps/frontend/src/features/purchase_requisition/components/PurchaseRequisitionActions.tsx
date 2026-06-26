import { useState } from "react";

import Button from "../../../components/ui/Button";

import {
  cancelPurchaseRequisition,
  submitPurchaseRequisition,
} from "../api/purchaseRequisitionApi";

import type { PurchaseRequisitionDetails } from "../types/purchaseRequisition.types";
import { userHasPermission } from "../../../utils/permissions";
import { refreshWorkQueues } from "../../../utils/refreshWorkQueues";

type Props = {
  purchaseRequisition: PurchaseRequisitionDetails;
  onUpdated: (purchaseRequisition: PurchaseRequisitionDetails) => void;
  onError: (message: string) => void;
};

export default function PurchaseRequisitionActions({
  purchaseRequisition,
  onUpdated,
  onError,
}: Props) {
  const [loadingAction, setLoadingAction] = useState<
    "submit" | "cancel" | null
  >(null);

  const hasSubmitPermission = userHasPermission("pr.submit");
  const hasCancelPermission = userHasPermission("pr.cancel");

  const canSubmit =
    purchaseRequisition.status === "DRAFT" && hasSubmitPermission;

  const canCancel =
    hasCancelPermission &&
    purchaseRequisition.status !== "CANCELLED" &&
    purchaseRequisition.status !== "CONVERTED_TO_PO";

  function getErrorMessage(error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as any).response?.data?.detail === "string"
    ) {
      return (error as any).response.data.detail;
    }

    return "Purchase requisition action failed.";
  }

  async function handleSubmit() {
    try {
      setLoadingAction("submit");

      const updatedPurchaseRequisition = await submitPurchaseRequisition(
        purchaseRequisition.id,
      );

      onUpdated(updatedPurchaseRequisition);
      refreshWorkQueues();
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  }

  async function handleCancel() {
    try {
      setLoadingAction("cancel");

      const updatedPurchaseRequisition = await cancelPurchaseRequisition(
        purchaseRequisition.id,
      );

      onUpdated(updatedPurchaseRequisition);
    } catch (error) {
      onError(getErrorMessage(error));
    } finally {
      setLoadingAction(null);
    }
  }

  if (!canSubmit && !canCancel) return null;

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
      {canSubmit && (
        <Button
          type="button"
          disabled={loadingAction !== null}
          onClick={handleSubmit}
        >
          {loadingAction === "submit" ? "Submitting..." : "Submit for Approval"}
        </Button>
      )}

      {canCancel && (
        <Button
          type="button"
          variant="danger"
          disabled={loadingAction !== null}
          onClick={handleCancel}
        >
          {loadingAction === "cancel" ? "Cancelling..." : "Cancel PR"}
        </Button>
      )}
    </div>
  );
}
