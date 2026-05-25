import axiosInstance from "../../../api/axiosInstance";
import type {
  PurchaseOrderCreatePayload,
  PurchaseOrderDetails,
  PurchaseOrderListItem,
  PurchaseOrderListParams,
  PurchaseOrderPaginatedResponse,
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

export async function getPaginatedPurchaseOrders(
  params: PurchaseOrderListParams = {},
): Promise<PurchaseOrderPaginatedResponse> {
  const response = await axiosInstance.get<PurchaseOrderPaginatedResponse>(
    "/purchase-orders/paginated",
    { params },
  );

  return response.data;
}

export async function getPurchaseOrdersReadyForInvoicing(): Promise<
  PurchaseOrderListItem[]
> {
  const response = await axiosInstance.get<PurchaseOrderListItem[]>(
    "/purchase-orders/ready-for-invoicing",
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

// PDF DOWNLOAD AND PLOAD
export async function downloadPurchaseOrderPdf(id: string): Promise<Blob> {
  const response = await axiosInstance.get(`/purchase-orders/${id}/pdf`, {
    responseType: "blob",
  });

  return response.data;
}

export async function uploadSignedPurchaseOrderPdf(
  id: string,
  file: File,
): Promise<PurchaseOrderDetails> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<PurchaseOrderDetails>(
    `/purchase-orders/${id}/signed-pdf`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function sendPurchaseOrderToSupplier(
  id: string,
): Promise<PurchaseOrderDetails> {
  const response = await axiosInstance.patch<PurchaseOrderDetails>(
    `/purchase-orders/${id}/send`,
  );

  return response.data;
}

export async function resendPurchaseOrderToSupplier(
  id: string,
): Promise<PurchaseOrderDetails> {
  const response = await axiosInstance.patch<PurchaseOrderDetails>(
    `/purchase-orders/${id}/resend`,
  );

  return response.data;
}
