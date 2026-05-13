import axiosInstance from "../../../api/axiosInstance";

import type {
  WorkflowLevelRole,
  CreateWorkflowLevelRolePayload,
  UpdateWorkflowLevelRolePayload,
} from "../types/approvalWorkflow.types";

const BASE_URL = "/workflow-level-roles";

export async function createWorkflowLevelRole(
  payload: CreateWorkflowLevelRolePayload,
): Promise<WorkflowLevelRole> {
  const response = await axiosInstance.post<WorkflowLevelRole>(
    `${BASE_URL}/`,
    payload,
  );

  return response.data;
}

export async function getWorkflowLevelRoles(): Promise<WorkflowLevelRole[]> {
  const response = await axiosInstance.get<WorkflowLevelRole[]>(`${BASE_URL}/`);

  return response.data;
}

export async function getWorkflowLevelRolesByLevel(
  levelId: string,
): Promise<WorkflowLevelRole[]> {
  const response = await axiosInstance.get<WorkflowLevelRole[]>(
    `${BASE_URL}/level/${levelId}`,
  );

  return response.data;
}

export async function getWorkflowLevelRoleById(
  workflowLevelRoleId: string,
): Promise<WorkflowLevelRole> {
  const response = await axiosInstance.get<WorkflowLevelRole>(
    `${BASE_URL}/${workflowLevelRoleId}`,
  );

  return response.data;
}

export async function updateWorkflowLevelRole(
  workflowLevelRoleId: string,
  payload: UpdateWorkflowLevelRolePayload,
): Promise<WorkflowLevelRole> {
  const response = await axiosInstance.put<WorkflowLevelRole>(
    `${BASE_URL}/${workflowLevelRoleId}`,
    payload,
  );

  return response.data;
}

export async function deleteWorkflowLevelRole(
  workflowLevelRoleId: string,
): Promise<{ message: string }> {
  const response = await axiosInstance.delete<{ message: string }>(
    `${BASE_URL}/${workflowLevelRoleId}`,
  );

  return response.data;
}
