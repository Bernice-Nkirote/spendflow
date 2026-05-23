import supplierAxiosInstance from "../../../api/supplierAxiosInstance";

import type {
  PaginatedResponse,
  SupplierInvoice,
  SupplierInvoiceLineItemCreate,
  SupplierPayment,
  SupplierPurchaseOrder,
} from "../types/supplierPortal.types";

export const getSupplierPurchaseOrders = async (): Promise<
  SupplierPurchaseOrder[]
> => {
  const response = await supplierAxiosInstance.get(
    "/supplier/purchase-orders/",
  );

  return response.data;
};

export const getPaginatedSupplierPurchaseOrders = async ({
  skip,
  limit,
}: {
  skip: number;
  limit: number;
}): Promise<PaginatedResponse<SupplierPurchaseOrder>> => {
  const response = await supplierAxiosInstance.get(
    "/supplier/purchase-orders/paginated/list",
    {
      params: { skip, limit },
    },
  );

  return response.data;
};

export const getSupplierPurchaseOrder = async (
  poId: string,
): Promise<SupplierPurchaseOrder> => {
  const response = await supplierAxiosInstance.get(
    `/supplier/purchase-orders/${poId}`,
  );

  return response.data;
};

export const getSupplierPurchaseOrderItems = async (poId: string) => {
  const response = await supplierAxiosInstance.get(
    `/supplier/purchase-orders/${poId}/items`,
  );

  return response.data;
};

export const createSupplierInvoice = async (payload: {
  purchase_order_id: string;
  supplier_id: string;
  line_items: SupplierInvoiceLineItemCreate[];
}): Promise<SupplierInvoice> => {
  const response = await supplierAxiosInstance.post(
    "/supplier/invoices/",
    payload,
  );

  return response.data;
};

export const getSupplierInvoices = async (): Promise<SupplierInvoice[]> => {
  const response = await supplierAxiosInstance.get("/supplier/invoices/");

  return response.data;
};

export const getPaginatedSupplierInvoices = async ({
  skip,
  limit,
}: {
  skip: number;
  limit: number;
}): Promise<PaginatedResponse<SupplierInvoice>> => {
  const response = await supplierAxiosInstance.get(
    "/supplier/invoices/paginated/list",
    {
      params: { skip, limit },
    },
  );

  return response.data;
};

export const getSupplierInvoice = async (
  invoiceId: string,
): Promise<SupplierInvoice> => {
  const response = await supplierAxiosInstance.get(
    `/supplier/invoices/${invoiceId}`,
  );

  return response.data;
};

export const submitSupplierInvoice = async (
  invoiceId: string,
): Promise<SupplierInvoice> => {
  const response = await supplierAxiosInstance.patch(
    `/supplier/invoices/${invoiceId}/submit`,
  );

  return response.data;
};

export const updateSupplierInvoice = async (
  invoiceId: string,
  payload: {
    line_items: SupplierInvoiceLineItemCreate[];
  },
): Promise<SupplierInvoice> => {
  const response = await supplierAxiosInstance.put(
    `/supplier/invoices/${invoiceId}`,
    payload,
  );

  return response.data;
};

export const getSupplierPayments = async (): Promise<SupplierPayment[]> => {
  const response = await supplierAxiosInstance.get("/supplier/payments/");

  return response.data;
};

export const getPaginatedSupplierPayments = async ({
  skip,
  limit,
}: {
  skip: number;
  limit: number;
}): Promise<PaginatedResponse<SupplierPayment>> => {
  const response = await supplierAxiosInstance.get(
    "/supplier/payments/paginated/list",
    {
      params: { skip, limit },
    },
  );

  return response.data;
};
