export type SupplierLeadTimeDetail = {
  po_id: string;
  po_number: string;

  supplier_id: string;
  supplier_name: string;

  invoice_id: string | null;
  invoice_number: string | null;

  issued_at: string | null;
  invoice_created_at: string | null;
  lead_time_days: number | null;

  po_status: string;
  invoice_status: string | null;
};
