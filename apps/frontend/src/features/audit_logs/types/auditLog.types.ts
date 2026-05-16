export type AuditLog = {
  id: string;
  company_id: string;

  entity_type: string;
  entity_id: string;
  action: string;

  actor_user_id: string | null;
  actor_supplier_user_id: string | null;

  actor_name: string | null;
  actor_email: string | null;
  actor_type: string | null;

  entity_reference: string | null;
  entity_label: string | null;
  action_label: string | null;

  description: string | null;

  details_json: Record<string, unknown> | null;
  old_values_json: Record<string, unknown> | null;
  new_values_json: Record<string, unknown> | null;

  created_at: string;
};

export type AuditLogFilters = {
  action?: string;
  entity_type?: string;
  date_from?: string;
  date_to?: string;
};
