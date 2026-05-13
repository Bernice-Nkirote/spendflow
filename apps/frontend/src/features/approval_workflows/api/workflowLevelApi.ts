import axiosInstance from "../../../api/axiosInstance";

import type {
  WorkflowLevel,
  CreateWorkflowLevelPayload,
  UpdateWorkflowLevelPayload,
} from "../types/approvalWorkflow.types";

const BASE_URL = "/workflow-levels";

export async function createWorkflowLevel(
  payload: CreateWorkflowLevelPayload,
): Promise<WorkflowLevel> {
  const response = await axiosInstance.post<WorkflowLevel>(
    `${BASE_URL}/`,
    payload,
  );

  return response.data;
}

export async function getWorkflowLevelsByWorkflow(
  workflowId: string,
): Promise<WorkflowLevel[]> {
  const response = await axiosInstance.get<WorkflowLevel[]>(
    `${BASE_URL}/by-workflow/${workflowId}`,
  );

  return response.data;
}

export async function getWorkflowLevelById(
  levelId: string,
): Promise<WorkflowLevel> {
  const response = await axiosInstance.get<WorkflowLevel>(
    `${BASE_URL}/${levelId}`,
  );

  return response.data;
}

export async function updateWorkflowLevel(
  levelId: string,
  payload: UpdateWorkflowLevelPayload,
): Promise<WorkflowLevel> {
  const response = await axiosInstance.put<WorkflowLevel>(
    `${BASE_URL}/${levelId}`,
    payload,
  );

  return response.data;
}
