export type User = {
  id: string;
  company_id: string;

  department_id: string | null;
  department_name: string | null;

  role_id: string;
  role_name: string | null;

  name: string;
  email: string;
  phone_number: string | null;

  is_active: boolean;

  has_completed_onboarding: boolean;
  onboarded_at: string | null;

  created_at: string;
  updated_at: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  phone_number?: string | null;
  department_id?: string | null;
  role_id: string;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  phone_number?: string | null;
  department_id?: string | null;
  role_id?: string;
};
