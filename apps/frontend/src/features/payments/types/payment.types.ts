export type PaymentStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "COMPLETED"
  | "REJECTED"
  | "FAILED";

export type PaymentMethod = "BANK_TRANSFER" | "MPESA" | "CASH";

export type PaymentDetails = {
  id: string;
  company_id: string;
  invoice_id: string;
  created_by: string | null;
  amount: string;
  currency: string | null;

  exchange_rate: string | null;
  base_currency: string | null;
  base_amount: string | null;
  exchange_rate_date: string | null;

  payment_method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  paid_at: string;
  created_at: string;

  invoice_number: string | null;
  supplier_name: string | null;
  created_by_name: string | null;
};

export type PaymentListItem = PaymentDetails;

export type PaymentCreatePayload = {
  invoice_id: string;
  amount: number;
  payment_method: PaymentMethod;
  reference?: string | null;
};

export type PaymentUpdatePayload = {
  amount?: number;
  payment_method?: PaymentMethod;
  reference?: string | null;
};

export type PaymentListParams = {
  skip?: number;
  limit?: number;
};

export type PaginatedPaymentResponse = {
  rows: PaymentListItem[];
  total_count: number;
};
