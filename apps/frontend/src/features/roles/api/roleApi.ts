import axiosInstance from "../../../api/axiosInstance";
import type {
  PaginatedRolesResponse,
  Role,
  RoleCreatePayload,
  RoleUpdatePayload,
} from "../types/role.types";

export async function getRoles(): Promise<Role[]> {
  const response = await axiosInstance.get<Role[]>("/roles/");
  return response.data;
}

export async function getPaginatedRoles({
  skip,
  limit,
}: {
  skip: number;
  limit: number;
}): Promise<PaginatedRolesResponse> {
  const response = await axiosInstance.get<PaginatedRolesResponse>(
    "/roles/paginated",
    {
      params: {
        skip,
        limit,
      },
    },
  );

  return response.data;
}

export async function getRole(roleId: string): Promise<Role> {
  const response = await axiosInstance.get<Role>(`/roles/${roleId}`);
  return response.data;
}

export async function createRole(payload: RoleCreatePayload): Promise<Role> {
  const response = await axiosInstance.post<Role>("/roles/", payload);
  return response.data;
}

export async function updateRole(
  roleId: string,
  payload: RoleUpdatePayload,
): Promise<Role> {
  const response = await axiosInstance.put<Role>(`/roles/${roleId}`, payload);
  return response.data;
}

export async function activateRole(roleId: string): Promise<Role> {
  const response = await axiosInstance.patch<Role>(`/roles/${roleId}/activate`);
  return response.data;
}

export async function deactivateRole(roleId: string): Promise<Role> {
  const response = await axiosInstance.patch<Role>(
    `/roles/${roleId}/deactivate`,
  );
  return response.data;
}

export async function deleteRole(roleId: string): Promise<void> {
  await axiosInstance.delete(`/roles/${roleId}`);
}
