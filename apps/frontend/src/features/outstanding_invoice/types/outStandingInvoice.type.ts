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
  status: string;
  created_at: string;
};
