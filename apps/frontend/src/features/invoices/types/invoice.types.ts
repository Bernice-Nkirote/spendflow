export type InvoiceStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "SENT"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CANCELLED"
  | "REJECTED";

export type InvoiceLineItem = {
  id: string;
  company_id: string;
  invoice_id: string;
  purchase_order_item_id: string;
  description: string;
  invoiced_quantity: string;
  unit_price: string;
  total_price: string;
  created_at: string;
  updated_at: string;
};

export type InvoiceDetails = {
  id: string;
  company_id: string;
  purchase_order_id: string | null;
  supplier_id: string;
  submitted_by_user_id: string | null;
  submitted_by_supplier_user_id: string | null;
  invoice_number: string;
  total_amount: string;

  currency: string | null;
  exchange_rate: string | null;
  base_currency: string | null;
  base_amount: string | null;
  exchange_rate_date: string | null;

  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
  line_items: InvoiceLineItem[];

  supplier_name: string | null;
  po_number: string | null;
  submitted_by_user_name: string | null;
  submitted_by_supplier_user_name: string | null;
};

export type InvoiceLineItemCreate = {
  purchase_order_item_id: string;
  description: string;
  invoiced_quantity: string;
  unit_price: string;
};

export type InvoiceCreatePayload = {
  purchase_order_id: string;
  supplier_id: string;
  invoice_number?: string | null;
  line_items: InvoiceLineItemCreate[];
};

export type InvoiceListItem = InvoiceDetails;

export type InvoiceListParams = {
  skip?: number;
  limit?: number;
};

export type InvoicePaginatedResponse = {
  rows: InvoiceListItem[];
  total_count: number;
};
