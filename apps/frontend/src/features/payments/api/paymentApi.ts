import axiosInstance from "../../../api/axiosInstance";
import type { PaymentDetails } from "../types/payment.types";

export async function getPaymentById(id: string): Promise<PaymentDetails> {
  const response = await axiosInstance.get<PaymentDetails>(`/payments/${id}`);
  return response.data;
}
