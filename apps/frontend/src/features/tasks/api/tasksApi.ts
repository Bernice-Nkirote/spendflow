import axiosInstance from "../../../api/axiosInstance";
import type { MyTasksResponse } from "../types/task.types";

export async function getMyActionTasks(): Promise<MyTasksResponse> {
  const response = await axiosInstance.get("/tasks/my-actions");

  return response.data;
}
