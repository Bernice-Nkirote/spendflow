export type SupplierLoginPayload = {
  email: string;
  password: string;
};

export type SupplierLoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export type SupplierMeResponse = {
  id: string;
  supplier_id: string;
  email: string;
  is_active: boolean;
  has_completed_onboarding: boolean;
  supplier_name?: string | null;
};

export type SupplierSetupPasswordPayload = {
  token: string;
  password: string;
};

export type SupplierForgotPasswordPayload = {
  email: string;
};

export type SupplierResetPasswordPayload = {
  token: string;
  password: string;
};
