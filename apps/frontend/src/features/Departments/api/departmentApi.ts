import axiosInstance from "../../../api/axiosInstance";
import type { Department } from "../types/department.types";

export async function getDepartments(): Promise<Department[]> {
  const response = await axiosInstance.get<Department[]>("/departments/");
  return response.data;
}
