import axiosInstance from "../../../api/axiosInstance";
import type {
  PurchaseOrderCreatePayload,
  PurchaseOrderDetails,
  PurchaseOrderListItem,
  PurchaseOrderListParams,
  PurchaseOrderUpdatePayload,
} from "../types/purchaseOrder.types";

export async function getPurchaseOrders(
  params: PurchaseOrderListParams = {},
): Promise<PurchaseOrderListItem[]> {
  const response = await axiosInstance.get<PurchaseOrderListItem[]>(
    "/purchase-orders/",
    { params },
  );

  return response.data;
}

export async function getPurchaseOrderById(
  id: string,
): Promise<PurchaseOrderDetails> {
  const response = await axiosInstance.get<PurchaseOrderDetails>(
    `/purchase-orders/${id}`,
  );

  return response.data;
}

export async function createPurchaseOrder(
  payload: PurchaseOrderCreatePayload,
): Promise<PurchaseOrderDetails> {
  const response = await axiosInstance.post<PurchaseOrderDetails>(
    "/purchase-orders/",
    payload,
  );

  return response.data;
}

export async function createPurchaseOrderFromRequisition(
  requisitionId: string,
  payload: PurchaseOrderCreatePayload,
): Promise<PurchaseOrderDetails> {
  const response = await axiosInstance.post<PurchaseOrderDetails>(
    `/purchase-orders/from-requisition/${requisitionId}`,
    payload,
  );

  return response.data;
}

export async function updatePurchaseOrder(
  id: string,
  payload: PurchaseOrderUpdatePayload,
): Promise<PurchaseOrderDetails> {
  const response = await axiosInstance.put<PurchaseOrderDetails>(
    `/purchase-orders/${id}`,
    payload,
  );

  return response.data;
}

export async function submitPurchaseOrder(
  id: string,
): Promise<PurchaseOrderDetails> {
  const response = await axiosInstance.patch<PurchaseOrderDetails>(
    `/purchase-orders/${id}/submit`,
  );

  return response.data;
}

export async function cancelPurchaseOrder(
  id: string,
): Promise<PurchaseOrderDetails> {
  const response = await axiosInstance.patch<PurchaseOrderDetails>(
    `/purchase-orders/${id}/cancel`,
  );

  return response.data;
}

export async function downloadPurchaseOrderPdf(id: string): Promise<Blob> {
  const response = await axiosInstance.get(`/purchase-orders/${id}/pdf`, {
    responseType: "blob",
  });

  return response.data;
}
