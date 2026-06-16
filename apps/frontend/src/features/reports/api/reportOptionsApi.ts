import axiosInstance from "../../../api/axiosInstance";
import type { ReportFilterOption } from "../types/report.types";

type DepartmentResponse = {
  id: string;
  name: string;
};

type SupplierResponse = {
  id: string;
  name: string;
  category?: string | null;
};

export async function getDepartmentOptions(): Promise<ReportFilterOption[]> {
  const response = await axiosInstance.get<DepartmentResponse[]>(
    "/departments/options",
  );

  return response.data.map((department) => ({
    label: department.name,
    value: department.id,
  }));
}

export async function getSupplierOptions(): Promise<ReportFilterOption[]> {
  const response = await axiosInstance.get<SupplierResponse[]>("/suppliers/", {
    params: { limit: 500 },
  });

  return response.data.map((supplier) => ({
    label: supplier.name,
    value: supplier.id,
    category: supplier.category ?? undefined,
  }));
}
