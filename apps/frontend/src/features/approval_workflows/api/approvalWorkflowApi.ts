import axiosInstance from "../../../api/axiosInstance";
import type {
  ApprovalWorkflow,
  CreateApprovalWorkflowPayload,
  UpdateApprovalWorkflowPayload,
} from "../types/approvalWorkflow.types";

const BASE_URL = "/workflows";

export async function getApprovalWorkflows(): Promise<ApprovalWorkflow[]> {
  const response = await axiosInstance.get<ApprovalWorkflow[]>(`${BASE_URL}/`);
  return response.data;
}

export async function getApprovalWorkflowById(
  workflowId: string,
): Promise<ApprovalWorkflow> {
  const response = await axiosInstance.get<ApprovalWorkflow>(
    `${BASE_URL}/${workflowId}`,
  );
  return response.data;
}

export async function createApprovalWorkflow(
  payload: CreateApprovalWorkflowPayload,
): Promise<ApprovalWorkflow> {
  const response = await axiosInstance.post<ApprovalWorkflow>(
    `${BASE_URL}/`,
    payload,
  );
  return response.data;
}

export async function updateApprovalWorkflow(
  workflowId: string,
  payload: UpdateApprovalWorkflowPayload,
): Promise<ApprovalWorkflow> {
  const response = await axiosInstance.put<ApprovalWorkflow>(
    `${BASE_URL}/${workflowId}`,
    payload,
  );
  return response.data;
}

export async function activateApprovalWorkflow(
  workflowId: string,
): Promise<ApprovalWorkflow> {
  const response = await axiosInstance.patch<ApprovalWorkflow>(
    `${BASE_URL}/${workflowId}/activate`,
  );
  return response.data;
}

export async function deactivateApprovalWorkflow(
  workflowId: string,
): Promise<ApprovalWorkflow> {
  const response = await axiosInstance.patch<ApprovalWorkflow>(
    `${BASE_URL}/${workflowId}/deactivate`,
  );
  return response.data;
}
