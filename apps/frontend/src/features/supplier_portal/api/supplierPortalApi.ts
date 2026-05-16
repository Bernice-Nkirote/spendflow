import supplierAxiosInstance from "../../../api/supplierAxiosInstance";

export const getSupplierPurchaseOrders = async () => {
  const response = await supplierAxiosInstance.get(
    "/supplier/purchase-orders/",
  );
  return response.data;
};

export const getSupplierPurchaseOrder = async (poId: string) => {
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
  line_items: {
    purchase_order_item_id: string;
    description: string;
    invoiced_quantity: string;
    unit_price: string;
  }[];
}) => {
  const response = await supplierAxiosInstance.post(
    "/supplier/invoices/",
    payload,
  );

  return response.data;
};

export const getSupplierInvoices = async () => {
  const response = await supplierAxiosInstance.get("/supplier/invoices/");
  return response.data;
};

export const getSupplierInvoice = async (invoiceId: string) => {
  const response = await supplierAxiosInstance.get(
    `/supplier/invoices/${invoiceId}`,
  );
  return response.data;
};

export const submitSupplierInvoice = async (invoiceId: string) => {
  const response = await supplierAxiosInstance.patch(
    `/supplier/invoices/${invoiceId}/submit`,
  );
  return response.data;
};

export const getSupplierPayments = async () => {
  const response = await supplierAxiosInstance.get("/supplier/payments/");
  return response.data;
};

export const updateSupplierInvoice = async (
  invoiceId: string,
  payload: {
    line_items: {
      purchase_order_item_id: string;
      description: string;
      invoiced_quantity: string;
      unit_price: string;
    }[];
  },
) => {
  const response = await supplierAxiosInstance.put(
    `/supplier/invoices/${invoiceId}`,
    payload,
  );

  return response.data;
};
