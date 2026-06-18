export type GlobalSearchItem = {
  entity_type: string;
  entity_id: string;
  title: string;
  subtitle?: string | null;
  reference?: string | null;
  status?: string | null;
  route: string;
  created_at?: string | null;
};

export type GlobalSearchResponse = {
  purchase_requisitions: GlobalSearchItem[];
  purchase_orders: GlobalSearchItem[];
  invoices: GlobalSearchItem[];
  payments: GlobalSearchItem[];
  suppliers: GlobalSearchItem[];
  users: GlobalSearchItem[];
  permissions: GlobalSearchItem[];
  audit_logs: GlobalSearchItem[];
  help: GlobalSearchItem[];
};
