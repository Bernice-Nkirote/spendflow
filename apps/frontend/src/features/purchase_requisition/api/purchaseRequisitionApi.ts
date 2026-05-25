import axiosInstance from "../../../api/axiosInstance";
import type {
  PurchaseRequisitionCreatePayload,
  PurchaseRequisitionDetails,
  PurchaseRequisitionItem,
  PurchaseRequisitionItemCreate,
  PurchaseRequisitionItemUpdatePayload,
  PurchaseRequisitionListItem,
  PurchaseRequisitionListParams,
  PurchaseRequisitionUpdatePayload,
  PurchaseRequisitionPaginatedResponse,
} from "../types/purchaseRequisition.types";

// CREATE PR
export async function createPurchaseRequisition(
  payload: PurchaseRequisitionCreatePayload,
): Promise<PurchaseRequisitionDetails> {
  const response = await axiosInstance.post<PurchaseRequisitionDetails>(
    "/purchase-requisitions/",
    payload,
  );

  return response.data;
}

// SUBMIT PR
export async function submitPurchaseRequisition(
  requisitionId: string,
): Promise<PurchaseRequisitionDetails> {
  const response = await axiosInstance.patch<PurchaseRequisitionDetails>(
    `/purchase-requisitions/${requisitionId}/submit`,
  );

  return response.data;
}

// CANCEL PR
export async function cancelPurchaseRequisition(
  requisitionId: string,
): Promise<PurchaseRequisitionDetails> {
  const response = await axiosInstance.patch<PurchaseRequisitionDetails>(
    `/purchase-requisitions/${requisitionId}/cancel`,
  );

  return response.data;
}

// GET PR
export async function getPurchaseRequisitions(
  params: PurchaseRequisitionListParams = {},
): Promise<PurchaseRequisitionListItem[]> {
  const response = await axiosInstance.get<PurchaseRequisitionListItem[]>(
    "/purchase-requisitions",
    { params },
  );

  return response.data;
}

//  GET PAGINATED PR
export async function getPaginatedPurchaseRequisitions(
  params: PurchaseRequisitionListParams = {},
): Promise<PurchaseRequisitionPaginatedResponse> {
  const response =
    await axiosInstance.get<PurchaseRequisitionPaginatedResponse>(
      "/purchase-requisitions/paginated",
      { params },
    );

  return response.data;
}

export async function getPurchaseRequisitionsReadyForPO(): Promise<
  PurchaseRequisitionListItem[]
> {
  const response = await axiosInstance.get<PurchaseRequisitionListItem[]>(
    "/purchase-requisitions/ready-for-po",
  );

  return response.data;
}

// GET PR BY ID
export async function getPurchaseRequisitionById(
  requisitionId: string,
): Promise<PurchaseRequisitionDetails> {
  const response = await axiosInstance.get<PurchaseRequisitionDetails>(
    `/purchase-requisitions/${requisitionId}`,
  );

  return response.data;
}

// UPDATE PR
export async function updatePurchaseRequisition(
  requisitionId: string,
  payload: PurchaseRequisitionUpdatePayload,
): Promise<PurchaseRequisitionDetails> {
  const response = await axiosInstance.put<PurchaseRequisitionDetails>(
    `/purchase-requisitions/${requisitionId}`,
    payload,
  );

  return response.data;
}

// PR ITEMS
export async function createPurchaseRequisitionItem(
  requisitionId: string,
  payload: PurchaseRequisitionItemCreate,
): Promise<PurchaseRequisitionItem> {
  const response = await axiosInstance.post<PurchaseRequisitionItem>(
    `/purchase-requisitions/${requisitionId}/items`,
    payload,
  );

  return response.data;
}

export async function updatePurchaseRequisitionItem(
  requisitionId: string,
  itemId: string,
  payload: PurchaseRequisitionItemUpdatePayload,
): Promise<PurchaseRequisitionItem> {
  const response = await axiosInstance.put<PurchaseRequisitionItem>(
    `/purchase-requisitions/${requisitionId}/items/${itemId}`,
    payload,
  );

  return response.data;
}

export async function deletePurchaseRequisitionItem(
  requisitionId: string,
  itemId: string,
): Promise<PurchaseRequisitionItem> {
  const response = await axiosInstance.delete<PurchaseRequisitionItem>(
    `/purchase-requisitions/${requisitionId}/items/${itemId}`,
  );

  return response.data;
}
