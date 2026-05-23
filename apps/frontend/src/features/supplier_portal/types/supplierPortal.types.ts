export type PaginatedResponse<T> = {
  rows: T[];
  total_count: number;
};

export type SupplierPurchaseOrderItem = {
  id: string;
  item_name: string;
  description?: string | null;
  quantity: string;
  unit_price: string;
  total_price: string;
};

export type SupplierPurchaseOrder = {
  id: string;
  po_number: string;
  supplier_id?: string;
  supplier_name?: string | null;
  status: string;
  total_amount: string;
  currency: string;
  base_amount?: string | null;
  base_currency?: string | null;
  exchange_rate?: string | null;
  exchange_rate_date?: string | null;
  issued_at?: string | null;
  created_at?: string;
  notes?: string | null;
  items: SupplierPurchaseOrderItem[];
};

export type SupplierInvoiceLineItem = {
  id: string;
  purchase_order_item_id: string;
  description: string;
  invoiced_quantity: string;
  unit_price: string;
  total_price: string;
};

export type SupplierInvoiceLineItemCreate = {
  purchase_order_item_id: string;
  description: string;
  invoiced_quantity: string;
  unit_price: string;
};

export type SupplierInvoice = {
  id: string;
  invoice_number: string;
  po_number?: string | null;
  supplier_name?: string | null;
  submitted_by_supplier_user_name?: string | null;
  status: string;
  total_amount: string;
  currency: string;
  base_amount?: string | null;
  base_currency?: string | null;
  exchange_rate?: string | null;
  exchange_rate_date?: string | null;
  created_at: string;
  updated_at?: string;
  line_items: SupplierInvoiceLineItem[];
};

export type SupplierPayment = {
  id: string;
  invoice_number?: string | null;
  supplier_name?: string | null;
  amount: string;
  currency: string;
  base_amount?: string | null;
  base_currency?: string | null;
  payment_method: string;
  status: string;
  reference?: string | null;
  paid_at?: string | null;
  created_at: string;
};
