export type ApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ActionType = "APPROVED" | "REJECTED";

export type EntityType = "PR" | "PO" | "INVOICE" | "PAYMENT";

export type ApprovalAction = {
  id: string;
  company_id: string;
  instance_id: string;
  level_id: string;
  user_id: string;
  user_name?: string | null;
  action: ActionType;
  comment?: string | null;
  created_at: string;
  updated_at: string;
};

export type ApprovalInstance = {
  id: string;
  workflow_id: string;
  entity_id: string;
  entity_type: EntityType;
  entity_reference?: string | null;
  entity_title?: string | null;
  requester_name?: string | null;
  total_amount?: number | null;
  currency?: string | null;
  workflow_name?: string | null;
  current_level_id?: string | null;
  current_level_name?: string | null;
  status: ApprovalStatus;
  company_id: string;
  created_at: string;
  updated_at: string;
  actions: ApprovalAction[];
};

export type CreateApprovalActionPayload = {
  instance_id: string;
  level_id: string;
  action: ActionType;
  comment?: string | null;
};
