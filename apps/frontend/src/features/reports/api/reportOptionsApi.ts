import axiosInstance from "../../../api/axiosInstance";
import type { ReportFilterOption } from "../types/report.types";

type DepartmentResponse = {
  id: string;
  name: string;
};

type SupplierResponse = {
  id: string;
  name: string;
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
  const response = await axiosInstance.get<SupplierResponse[]>("/suppliers/");

  return response.data.map((supplier) => ({
    label: supplier.name,
    value: supplier.id,
  }));
}
