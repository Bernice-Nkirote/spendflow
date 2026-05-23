export type SetupPasswordPayload = {
  token: string;
  password: string;
};

export type ForgotPasswordPayload = {
  company_name: string;
  email: string;
};

export type ResetPasswordPayload = {
  token: string;
  password: string;
};

export type LoginPayload = {
  company_name: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};
