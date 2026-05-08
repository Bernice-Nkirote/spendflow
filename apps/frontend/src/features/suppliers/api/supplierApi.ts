import axiosInstance from "../../../api/axiosInstance";
import type {
  Supplier,
  SupplierCreatePayload,
  SupplierUpdatePayload,
} from "../types/supplier.types";

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await axiosInstance.get<Supplier[]>("/suppliers/");
  return response.data;
}

export async function getSupplierById(supplierId: string): Promise<Supplier> {
  const response = await axiosInstance.get<Supplier>(
    `/suppliers/${supplierId}`,
  );
  return response.data;
}

export async function createSupplier(
  payload: SupplierCreatePayload,
): Promise<Supplier> {
  const response = await axiosInstance.post<Supplier>("/suppliers/", payload);
  return response.data;
}

export async function updateSupplier(
  supplierId: string,
  payload: SupplierUpdatePayload,
): Promise<Supplier> {
  const response = await axiosInstance.put<Supplier>(
    `/suppliers/${supplierId}`,
    payload,
  );
  return response.data;
}

export async function activateSupplier(supplierId: string): Promise<Supplier> {
  const response = await axiosInstance.patch<Supplier>(
    `/suppliers/${supplierId}/activate`,
  );
  return response.data;
}

export async function deactivateSupplier(
  supplierId: string,
): Promise<Supplier> {
  const response = await axiosInstance.patch<Supplier>(
    `/suppliers/${supplierId}/deactivate`,
  );
  return response.data;
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  await axiosInstance.delete(`/suppliers/${supplierId}`);
}
