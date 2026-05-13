import axiosInstance from "../../../api/axiosInstance";
import type {
  Department,
  DepartmentCreatePayload,
  DepartmentUpdatePayload,
} from "../types/department.types";

export async function getDepartments(): Promise<Department[]> {
  const response = await axiosInstance.get<Department[]>("/departments/");
  return response.data;
}

export async function getDepartment(departmentId: string): Promise<Department> {
  const response = await axiosInstance.get<Department>(
    `/departments/${departmentId}`,
  );
  return response.data;
}

export async function createDepartment(
  payload: DepartmentCreatePayload,
): Promise<Department> {
  const response = await axiosInstance.post<Department>(
    "/departments/",
    payload,
  );
  return response.data;
}

export async function updateDepartment(
  departmentId: string,
  payload: DepartmentUpdatePayload,
): Promise<Department> {
  const response = await axiosInstance.put<Department>(
    `/departments/${departmentId}`,
    payload,
  );
  return response.data;
}

export async function activateDepartment(
  departmentId: string,
): Promise<Department> {
  const response = await axiosInstance.patch<Department>(
    `/departments/${departmentId}/activate`,
  );
  return response.data;
}

export async function deactivateDepartment(
  departmentId: string,
): Promise<Department> {
  const response = await axiosInstance.patch<Department>(
    `/departments/${departmentId}/deactivate`,
  );
  return response.data;
}

export async function deleteDepartment(departmentId: string): Promise<void> {
  await axiosInstance.delete(`/departments/${departmentId}`);
}
