export type ExchangeRate = {
  id: string;
  company_id: string;
  from_currency: string;
  to_currency: string;
  rate: string;
  source: string;
  effective_date: string;
  created_by?: string | null;
  created_at: string;
};

export type ExchangeRateCreatePayload = {
  from_currency: string;
  to_currency: string;
  rate: number;
  source?: string;
  effective_date: string;
};

export type ExchangeRateUpdatePayload = {
  rate?: number;
  source?: string;
  effective_date?: string;
};
