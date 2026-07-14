import axiosInstance from "../../../api/axiosInstance";
import type {
  PaymentCreatePayload,
  PaymentDetails,
  PaymentListItem,
  PaymentListParams,
  PaginatedPaymentResponse,
  PaymentUpdatePayload,
  PaymentRecordPayload,
} from "../types/payment.types";

export async function getPayments(
  params: PaymentListParams = {},
): Promise<PaymentListItem[]> {
  const response = await axiosInstance.get<PaymentListItem[]>("/payments/", {
    params,
  });

  return response.data;
}

export async function getPaginatedPayments(
  params: PaymentListParams = {},
): Promise<PaginatedPaymentResponse> {
  const response = await axiosInstance.get<PaginatedPaymentResponse>(
    "/payments/paginated",
    { params },
  );

  return response.data;
}

export async function getPaymentsByInvoice(
  invoiceId: string,
): Promise<PaymentListItem[]> {
  const response = await axiosInstance.get<PaymentListItem[]>(
    `/payments/invoice/${invoiceId}`,
  );

  return response.data;
}

export async function getPaymentById(id: string): Promise<PaymentDetails> {
  const response = await axiosInstance.get<PaymentDetails>(`/payments/${id}`);

  return response.data;
}

export async function createPayment(
  payload: PaymentCreatePayload,
): Promise<PaymentDetails> {
  const response = await axiosInstance.post<PaymentDetails>(
    "/payments/",
    payload,
  );

  return response.data;
}

export async function updatePayment(
  id: string,
  payload: PaymentUpdatePayload,
): Promise<PaymentDetails> {
  const response = await axiosInstance.put<PaymentDetails>(
    `/payments/${id}`,
    payload,
  );

  return response.data;
}

export async function submitPayment(id: string): Promise<PaymentDetails> {
  const response = await axiosInstance.patch<PaymentDetails>(
    `/payments/${id}/submit`,
  );

  return response.data;
}

export async function recordPayment(
  id: string,
  payload: PaymentRecordPayload,
): Promise<PaymentDetails> {
  const response = await axiosInstance.patch<PaymentDetails>(
    `/payments/${id}/record`,
    payload,
  );

  return response.data;
}
export async function deletePayment(id: string): Promise<void> {
  await axiosInstance.delete(`/payments/${id}`);
}
