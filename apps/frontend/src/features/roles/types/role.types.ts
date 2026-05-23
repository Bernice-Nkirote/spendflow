export type Role = {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type RoleCreatePayload = {
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export type RoleUpdatePayload = {
  name?: string;
  description?: string | null;
  is_active?: boolean;
};

export type PaginatedRolesResponse = {
  rows: Role[];
  total_count: number;
};
