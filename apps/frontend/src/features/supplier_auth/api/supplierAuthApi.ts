import axios from "axios";
import supplierAxiosInstance from "../../../api/supplierAxiosInstance";

import type {
  SupplierForgotPasswordPayload,
  SupplierLoginPayload,
  SupplierLoginResponse,
  SupplierMeResponse,
  SupplierResetPasswordPayload,
  SupplierSetupPasswordPayload,
} from "../types/supplierAuth.types";

export async function supplierLogin(
  payload: SupplierLoginPayload,
): Promise<SupplierLoginResponse> {
  const response = await axios.post<SupplierLoginResponse>(
    `${import.meta.env.VITE_API_BASE_URL}/supplier-auth/login`,
    payload,
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
}

export async function getCurrentSupplier(): Promise<SupplierMeResponse> {
  const response =
    await supplierAxiosInstance.get<SupplierMeResponse>("/supplier-auth/me");

  return response.data;
}

export async function setSupplierPassword(
  payload: SupplierSetupPasswordPayload,
) {
  const response = await supplierAxiosInstance.post(
    "/supplier-users/set-password",
    payload,
  );

  return response.data;
}

export async function supplierForgotPassword(
  payload: SupplierForgotPasswordPayload,
) {
  const response = await supplierAxiosInstance.post(
    "/supplier-auth/forgot-password",
    payload,
  );

  return response.data;
}

export async function supplierResetPassword(
  payload: SupplierResetPasswordPayload,
) {
  const response = await supplierAxiosInstance.post(
    "/supplier-auth/reset-password",
    payload,
  );

  return response.data;
}
