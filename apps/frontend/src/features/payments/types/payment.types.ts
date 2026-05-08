export type PaymentDetails = {
  id: string;
  company_id: string;
  invoice_id: string;
  created_by: string | null;
  amount: string;
  payment_method: string;
  status: string;
  reference: string | null;
  paid_at: string;
  created_at: string;

  invoice_number: string | null;
  supplier_name: string | null;
  created_by_name: string | null;
};
