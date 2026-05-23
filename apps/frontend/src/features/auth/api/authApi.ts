import axios from "axios";
import axiosInstance from "../../../api/axiosInstance";

import type {
  ForgotPasswordPayload,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
  SetupPasswordPayload,
} from "../types/auth.types";

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await axios.post<LoginResponse>(
    `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

export async function setupPassword(payload: SetupPasswordPayload) {
  const response = await axiosInstance.post("/auth/setup-password", payload);

  return response.data;
}

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const response = await axiosInstance.post("/auth/forgot-password", payload);

  return response.data;
}

export async function resetPassword(payload: ResetPasswordPayload) {
  const response = await axiosInstance.post("/auth/reset-password", payload);

  return response.data;
}
