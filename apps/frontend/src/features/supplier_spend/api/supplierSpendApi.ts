import axiosInstance from "../../../api/axiosInstance";
import type { SupplierSpendDetail } from "../types/supplierSpendDetail.types";

export async function getSupplierSpendDetail(
  supplierId: string,
): Promise<SupplierSpendDetail> {
  const response = await axiosInstance.get<SupplierSpendDetail>(
    `/reports/supplier-spend/${supplierId}`,
  );

  return response.data;
}
