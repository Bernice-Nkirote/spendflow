import axiosInstance from "../../../api/axiosInstance";
import type {
  ApprovalAction,
  ApprovalInstance,
  ApprovalStatus,
  CreateApprovalActionPayload,
  PaginatedApprovalInstancesResponse,
} from "../types/approval.types";

export async function getApprovalInstances(): Promise<ApprovalInstance[]> {
  const response = await axiosInstance.get<ApprovalInstance[]>(
    "/approval-instances/",
  );

  return response.data;
}

export async function getPaginatedApprovalInstances(params: {
  page: number;
  pageSize: number;
  status?: ApprovalStatus;
  excludeStatus?: ApprovalStatus;
}): Promise<PaginatedApprovalInstancesResponse> {
  const skip = (params.page - 1) * params.pageSize;

  const response = await axiosInstance.get<PaginatedApprovalInstancesResponse>(
    "/approval-instances/paginated",
    {
      params: {
        skip,
        limit: params.pageSize,
        status: params.status,
        exclude_status: params.excludeStatus,
      },
    },
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

export async function getApprovalInstancesByEntity(
  entityId: string,
): Promise<ApprovalInstance[]> {
  const instances = await getApprovalInstances();

  return instances.filter((instance) => instance.entity_id === entityId);
}

export async function getMyPendingApprovalQueue(params: {
  page: number;
  pageSize: number;
}): Promise<PaginatedApprovalInstancesResponse> {
  const skip = (params.page - 1) * params.pageSize;

  const response = await axiosInstance.get<PaginatedApprovalInstancesResponse>(
    "/approval-instances/my-queue",
    {
      params: {
        skip,
        limit: params.pageSize,
      },
    },
  );

  return response.data;
}
