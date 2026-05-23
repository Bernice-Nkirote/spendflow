export type Supplier = {
  id: string;
  company_id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  contact_person?: string | null;
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
