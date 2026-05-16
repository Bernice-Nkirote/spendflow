import axiosInstance from "../../../api/axiosInstance";
import type {
  Supplier,
  SupplierCreatePayload,
  SupplierUpdatePayload,
  SupplierImportResult,
} from "../types/supplier.types";

// SUPPLIER USER
import type {
  SupplierUser,
  SupplierUserCreatePayload,
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

// SUPPLIER USER

export async function getSupplierUsers(
  supplierId: string,
): Promise<SupplierUser[]> {
  const response = await axiosInstance.get<SupplierUser[]>(
    `/supplier-users/supplier/${supplierId}`,
  );

  return response.data;
}

export async function createSupplierUser(
  payload: SupplierUserCreatePayload,
): Promise<SupplierUser> {
  const response = await axiosInstance.post<SupplierUser>(
    "/supplier-users/",
    payload,
  );

  return response.data;
}

export async function importSuppliersFromExcel(
  file: File,
): Promise<SupplierImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await axiosInstance.post<SupplierImportResult>(
    "/suppliers/import-excel",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function activateSupplierUser(
  supplierUserId: string,
  supplierId: string,
): Promise<SupplierUser> {
  const response = await axiosInstance.patch<SupplierUser>(
    `/supplier-users/${supplierUserId}/supplier/${supplierId}/activate`,
  );

  return response.data;
}

export async function deactivateSupplierUser(
  supplierUserId: string,
  supplierId: string,
): Promise<SupplierUser> {
  const response = await axiosInstance.patch<SupplierUser>(
    `/supplier-users/${supplierUserId}/supplier/${supplierId}/deactivate`,
  );

  return response.data;
}

export async function resendSupplierSetupLink(
  supplierUserId: string,
  supplierId: string,
): Promise<SupplierUser> {
  const response = await axiosInstance.post<SupplierUser>(
    `/supplier-users/${supplierUserId}/supplier/${supplierId}/resend-setup-link`,
  );

  return response.data;
}
