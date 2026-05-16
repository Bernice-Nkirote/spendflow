export type OutstandingInvoiceDetail = {
  invoice_id: string;
  invoice_number: string;
  supplier_id: string;
  supplier_name?: string;
  purchase_order_id?: string;
  po_number?: string;
  total_amount: string;
  amount_paid: string;
  outstanding_amount: string;
  currency: string | null;

  base_currency: string | null;
  base_total_amount: string | null;
  base_amount_paid: string | null;
  base_outstanding_amount: string | null;

  status: string;
  created_at: string;
};
