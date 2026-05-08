import axiosInstance from "../../../api/axiosInstance";
import type { OutstandingInvoiceDetail } from "../types/outStandingInvoice.type";
export async function getOutstandingInvoiceDetail(
  invoiceId: string,
): Promise<OutstandingInvoiceDetail> {
  const response = await axiosInstance.get<OutstandingInvoiceDetail>(
    `/reports/outstanding-invoices/${invoiceId}`,
  );

  return response.data;
}
