export type SupplierSpendInvoiceItem = {
  invoice_id: string;
  invoice_number: string;
  po_number: string | null;

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

export type SupplierSpendPaymentItem = {
  payment_id: string;
  payment_reference: string | null;
  invoice_id: string;
  invoice_number: string;

  amount: string;
  currency: string | null;

  base_currency: string | null;
  base_amount: string | null;

  payment_method: string | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

export type SupplierSpendDetail = {
  supplier_id: string;
  supplier_name: string;

  total_invoice_amount: string;
  total_paid_amount: string;
  outstanding_amount: string;

  base_currency: string | null;
  base_total_invoice_amount: string | null;
  base_total_paid_amount: string | null;
  base_outstanding_amount: string | null;

  invoice_count: number;
  payment_count: number;

  invoices: SupplierSpendInvoiceItem[];
  payments: SupplierSpendPaymentItem[];
};
