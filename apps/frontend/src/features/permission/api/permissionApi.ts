import axiosInstance from "../../../api/axiosInstance";
import type {
  AssignPermissionPayload,
  Permission,
  RolePermission,
} from "../types/permission.types";

export async function getPermissions(): Promise<Permission[]> {
  const response = await axiosInstance.get<Permission[]>("/permissions/");
  return response.data;
}

export async function getPermissionsForRole(
  roleId: string,
): Promise<RolePermission[]> {
  const response = await axiosInstance.get<RolePermission[]>(
    `/permissions/roles/${roleId}`,
  );
  return response.data;
}

export async function assignPermissionToRole(
  payload: AssignPermissionPayload,
): Promise<void> {
  await axiosInstance.post("/permissions/roles/assign", payload);
}

export async function removePermissionFromRole(
  rolePermissionId: string,
): Promise<void> {
  await axiosInstance.delete(`/permissions/roles/${rolePermissionId}`);
}
