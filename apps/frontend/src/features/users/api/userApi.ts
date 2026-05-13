import axiosInstance from "../../../api/axiosInstance";

import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
} from "../types/user.types";

export async function getUsers(): Promise<User[]> {
  const response = await axiosInstance.get<User[]>("/users/");
  return response.data;
}

export async function createUser(data: CreateUserPayload) {
  const response = await axiosInstance.post<User>("/users/", data);
  return response.data;
}

export async function updateUser(userId: string, data: UpdateUserPayload) {
  const response = await axiosInstance.put<User>(`/users/${userId}`, data);

  return response.data;
}

export async function activateUser(userId: string) {
  const response = await axiosInstance.patch<User>(`/users/${userId}/activate`);

  return response.data;
}

export async function deactivateUser(userId: string) {
  const response = await axiosInstance.patch<User>(
    `/users/${userId}/deactivate`,
  );

  return response.data;
}

export async function deleteUser(userId: string) {
  await axiosInstance.delete(`/users/${userId}`);
}
