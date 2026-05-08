import axiosInstance from "../../../api/axiosInstance";
import type { SupplierLeadTimeDetail } from "../types/supplierLeadTimeDetail.types";

export async function getSupplierLeadTimeDetail(
  poId: string,
): Promise<SupplierLeadTimeDetail> {
  const response = await axiosInstance.get<SupplierLeadTimeDetail>(
    `/reports/supplier-lead-time/${poId}`,
  );

  return response.data;
}
