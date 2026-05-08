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
  status: string;
  created_at: string;
  updated_at: string;
  line_items: InvoiceLineItem[];

  supplier_name: string | null;
  po_number: string | null;
  submitted_by_user_name: string | null;
  submitted_by_supplier_user_name: string | null;
};
