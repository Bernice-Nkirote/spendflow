import axiosInstance from "../../../api/axiosInstance";
import type {
  ApprovalAction,
  ApprovalInstance,
  CreateApprovalActionPayload,
} from "../types/approval.types";

export async function getApprovalInstances(): Promise<ApprovalInstance[]> {
  const response = await axiosInstance.get<ApprovalInstance[]>(
    "/approval-instances/",
  );

  return response.data;
}

export async function getApprovalInstanceById(
  instanceId: string,
): Promise<ApprovalInstance> {
  const response = await axiosInstance.get<ApprovalInstance>(
    `/approval-instances/${instanceId}`,
  );

  return response.data;
}

export async function getApprovalActionsByInstance(
  instanceId: string,
): Promise<ApprovalAction[]> {
  const response = await axiosInstance.get<ApprovalAction[]>(
    `/approval-actions/instance/${instanceId}`,
  );

  return response.data;
}

export async function createApprovalAction(
  payload: CreateApprovalActionPayload,
): Promise<ApprovalAction> {
  const response = await axiosInstance.post<ApprovalAction>(
    "/approval-actions/",
    payload,
  );

  return response.data;
}
