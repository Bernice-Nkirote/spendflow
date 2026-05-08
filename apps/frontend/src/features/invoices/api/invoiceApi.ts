import axiosInstance from "../../../api/axiosInstance";
import type { InvoiceDetails } from "../types/invoice.types";

export async function getInvoiceById(id: string): Promise<InvoiceDetails> {
  const response = await axiosInstance.get<InvoiceDetails>(`/invoices/${id}`);
  return response.data;
}
