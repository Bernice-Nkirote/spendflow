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
