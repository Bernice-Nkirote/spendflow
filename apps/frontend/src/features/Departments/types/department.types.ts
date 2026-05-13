export type Department = {
  id: string;
  company_id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type DepartmentCreatePayload = {
  name: string;
  is_active?: boolean;
};

export type DepartmentUpdatePayload = {
  name?: string;
  is_active?: boolean;
};
