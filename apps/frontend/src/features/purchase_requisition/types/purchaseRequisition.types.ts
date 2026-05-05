export type PurchaseRequisitionStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

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
