import supplierAxiosInstance from "../../../api/supplierAxiosInstance";

export async function setSupplierPassword(payload: {
  token: string;
  password: string;
}) {
  const response = await supplierAxiosInstance.post(
    "/supplier-users/set-password",
    payload,
  );

  return response.data;
}
