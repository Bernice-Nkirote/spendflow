import axiosInstance from "../../../api/axiosInstance";
import type {
  InvoiceCreatePayload,
  InvoiceDetails,
  InvoiceListItem,
  InvoiceListParams,
} from "../types/invoice.types";

export async function getInvoices(
  params: InvoiceListParams = {},
): Promise<InvoiceListItem[]> {
  const response = await axiosInstance.get<InvoiceListItem[]>("/invoices/", {
    params,
  });

  return response.data;
}

export async function getInvoiceById(id: string): Promise<InvoiceDetails> {
  const response = await axiosInstance.get<InvoiceDetails>(`/invoices/${id}`);

  return response.data;
}

export async function getInvoicesByPurchaseOrder(
  purchaseOrderId: string,
): Promise<InvoiceListItem[]> {
  const response = await axiosInstance.get<InvoiceListItem[]>(
    `/invoices/purchase-order/${purchaseOrderId}`,
  );

  return response.data;
}

export async function createInvoice(
  payload: InvoiceCreatePayload,
): Promise<InvoiceDetails> {
  const response = await axiosInstance.post<InvoiceDetails>(
    "/invoices/",
    payload,
  );

  return response.data;
}

export async function submitInvoice(id: string): Promise<InvoiceDetails> {
  const response = await axiosInstance.patch<InvoiceDetails>(
    `/invoices/${id}/submit`,
  );

  return response.data;
}

export async function deleteInvoice(id: string): Promise<void> {
  await axiosInstance.delete(`/invoices/${id}`);
}
