import axiosInstance from "../../api/axiosInstance";

type SetupPasswordPayload = {
  token: string;
  password: string;
};

export async function setupPassword(payload: SetupPasswordPayload) {
  const response = await axiosInstance.post("/auth/setup-password", payload);
  return response.data;
}
