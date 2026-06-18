export type ApprovalEntityType = "PR" | "PO" | "INVOICE" | "PAYMENT";

export type WorkflowLevelRole = {
  id: string;
  company_id: string;
  level_id: string;
  role_id: string;
  role_name?: string | null;
  level_name?: string | null;
  created_at: string;
  updated_at: string;
  role?: {
    id: string;
    company_id: string;
    name: string;
    description?: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
};

export type WorkflowLevel = {
  id: string;
  workflow_id: string;
  company_id: string;
  level_order: number;
  name: string;
  min_amount?: string | number | null;
  max_amount?: string | number | null;
  department_id: string;
  workflow_name?: string | null;
  department_name?: string | null;
  condition_expression?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  level_roles: WorkflowLevelRole[];
};

export type ApprovalWorkflow = {
  id: string;
  company_id: string;
  name: string;
  entity_type: ApprovalEntityType;
  is_active: boolean;
  partner_approval_mode?: PartnerApprovalMode | null;
  partner_approval_min_count?: number | null;
  partner_role_id?: string | null;
  created_at: string;
  updated_at: string;
  levels: WorkflowLevel[];
};

export type PartnerApprovalMode =
  | "workflow_levels"
  | "any_partner"
  | "all_partners"
  | "minimum_partners";

export type CreateApprovalWorkflowPayload = {
  name: string;
  entity_type: ApprovalEntityType;
  partner_approval_mode?: PartnerApprovalMode | null;
  partner_approval_min_count?: number | null;
  partner_role_id?: string | null;
};

export type UpdateApprovalWorkflowPayload = {
  name?: string;
  entity_type?: ApprovalEntityType;
  is_active?: boolean;
  partner_approval_mode?: PartnerApprovalMode | null;
  partner_approval_min_count?: number | null;
  partner_role_id?: string | null;
};

export type CreateWorkflowLevelPayload = {
  workflow_id: string;
  level_order: number;
  name: string;
  min_amount?: number | null;
  max_amount?: number | null;
  department_id: string;
  condition_expression?: Record<string, unknown> | null;
};

export type UpdateWorkflowLevelPayload = {
  name?: string;
  level_order?: number;
  min_amount?: number | null;
  max_amount?: number | null;
  department_id?: string;
  condition_expression?: Record<string, unknown> | null;
};

export type CreateWorkflowLevelRolePayload = {
  level_id: string;
  role_id: string;
};

export type UpdateWorkflowLevelRolePayload = {
  role_id?: string;
};

export const approvalEntityTypeOptions: {
  label: string;
  value: ApprovalEntityType;
}[] = [
  { label: "Purchase Requisition", value: "PR" },
  { label: "Purchase Order", value: "PO" },
  { label: "Invoice", value: "INVOICE" },
  { label: "Payment", value: "PAYMENT" },
];

export const partnerApprovalModeOptions: {
  label: string;
  value: PartnerApprovalMode;
  description: string;
}[] = [
  {
    label: "Use the normal workflow",
    value: "workflow_levels",
    description: "Use the approval levels below exactly as configured.",
  },
  {
    label: "One partner can approve",
    value: "any_partner",
    description: "A single user in the partner role can approve this step.",
  },
  {
    label: "Every partner must approve",
    value: "all_partners",
    description: "Every active user in the partner role should approve.",
  },
  {
    label: "Require a set number of partners",
    value: "minimum_partners",
    description: "Choose how many partner approvals are needed.",
  },
];
