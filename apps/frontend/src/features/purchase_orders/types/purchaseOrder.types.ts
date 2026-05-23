export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED";

export type PurchaseOrderItem = {
  id: string;
  company_id: string;
  purchase_order_id: string;
  item_name: string;
  description: string | null;
  quantity: string;
  unit_price: string;
  total_price: string;
  created_at: string;
  updated_at: string;
};

export type PurchaseOrderDetails = {
  id: string;
  company_id: string;
  po_number: string;
  created_by: string;
  submitted_by: string | null;
  issued_by: string | null;
  purchase_requisition_id: string | null;
  supplier_id: string;
  department_id: string | null;
  status: PurchaseOrderStatus;
  total_amount: string;
  currency: string;

  exchange_rate: string | null;
  base_currency: string | null;
  base_amount: string | null;
  exchange_rate_date: string | null;

  notes: string | null;
  submitted_at: string | null;
  issued_at: string | null;

  signed_pdf_file_path: string | null;
  signed_pdf_original_filename: string | null;
  signed_pdf_uploaded_by: string | null;
  signed_pdf_uploaded_at: string | null;

  created_at: string;
  updated_at: string;
  items: PurchaseOrderItem[];

  supplier_name: string | null;
  department_name: string | null;
  created_by_name: string | null;
  submitted_by_name: string | null;
  issued_by_name: string | null;
  signed_pdf_uploaded_by_name: string | null;
  pr_number: string | null;
};

export type PurchaseOrderListItem = PurchaseOrderDetails;

export type PurchaseOrderListParams = {
  skip?: number;
  limit?: number;
};

export type PurchaseOrderPaginatedResponse = {
  rows: PurchaseOrderListItem[];
  total_count: number;
};

export type PurchaseOrderItemCreate = {
  item_name: string;
  description?: string | null;
  quantity: string;
  unit_price: string;
};

export type PurchaseOrderCreatePayload = {
  supplier_id: string;
  department_id?: string | null;
  currency: string;
  notes?: string | null;
  items: PurchaseOrderItemCreate[];
};

export type PurchaseOrderUpdatePayload = {
  supplier_id?: string;
  department_id?: string | null;
  currency?: string;
  notes?: string | null;
  items?: PurchaseOrderItemCreate[];
};
