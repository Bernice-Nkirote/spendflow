export type Supplier = {
  id: string;
  company_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
  category?: string | null;
  sub_category?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SupplierCreatePayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
  category?: string | null;
  sub_category?: string | null;
};

export type SupplierUpdatePayload = Partial<SupplierCreatePayload> & {
  is_active?: boolean;
};

export type SupplierImportError = {
  row: number;
  message: string;
};

export type SupplierImportResult = {
  created_count: number;
  failed_count: number;
  errors: SupplierImportError[];
  created_suppliers: Supplier[];
};

export type SupplierSummary = {
  supplier_id: string;
  name: string;
  category?: string | null;
  sub_category?: string | null;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  supplies: string[];
  location?: string | null;
  recent_supplied_items: SupplierSupplyHistoryItem[];
};

export type SupplierSupplyHistoryItem = {
  item_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  po_id: string;
  po_number: string;
  po_status: string;
  supplied_at: string;
};

// SUPPLIER USER
export type SupplierUser = {
  id: string;
  supplier_id: string;
  email: string;
  is_active: boolean;
  has_completed_onboarding: boolean;
  setup_link?: string | null;
  created_at: string;
  updated_at: string;
};

export type SupplierUserCreatePayload = {
  supplier_id: string;
  email: string;
};

export type SupplierListParams = {
  skip?: number;
  limit?: number;
};

export type PaginatedSupplierResponse = {
  rows: Supplier[];
  total_count: number;
};
