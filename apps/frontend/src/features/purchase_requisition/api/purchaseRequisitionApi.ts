import axiosInstance from "../../../api/axiosInstance";
import type { PurchaseRequisitionDetails } from "../types/PurchaseRequisition.types";
export async function getPurchaseRequisitionById(
  requisitionId: string,
): Promise<PurchaseRequisitionDetails> {
  const response = await axiosInstance.get<PurchaseRequisitionDetails>(
    `/purchase-requisitions/${requisitionId}`,
  );

  return response.data;
}
