export type PurchaseRequisitionStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "CONVERTED_TO_PO";

export type PurchaseRequisitionDetails = {
  id: string;
  company_id: string;
  pr_number: string;
  department_id: string | null;
  department_name: string | null;
  requested_by_name: string | null;
  title: string;
  description: string | null;
  total_amount: string;
  currency: string;

  exchange_rate: string | null;
  base_currency: string | null;
  base_amount: string | null;
  exchange_rate_date: string | null;

  status: PurchaseRequisitionStatus;
  is_active: boolean;
  items: PurchaseRequisitionItem[];
  created_at: string;
  updated_at: string;
};

export type PurchaseRequisitionItem = {
  id: string;
  company_id: string;
  requisition_id: string;
  item_name: string;
  description: string;
  quantity: string;
  unit_price: string | null;
  line_total: string | null;
  created_at: string;
  updated_at: string;
};

export type PurchaseRequisitionListItem = Omit<
  PurchaseRequisitionDetails,
  "department_name" | "requested_by_name"
>;

export type PurchaseRequisitionListParams = {
  skip?: number;
  limit?: number;
};

export type PurchaseRequisitionItemCreate = {
  item_name: string;
  description: string;
  quantity: string;
  unit_price: string;
};

export type PurchaseRequisitionCreatePayload = {
  title: string;
  description?: string;
  currency: string;
  department_id?: string;
  items: PurchaseRequisitionItemCreate[];
};

export type PurchaseRequisitionUpdatePayload = {
  title?: string;
  description?: string | null;
  currency?: string;
  department_id?: string | null;
};

export type PurchaseRequisitionItemUpdatePayload = {
  item_name?: string;
  description?: string;
  quantity?: string;
  unit_price?: string;
};
