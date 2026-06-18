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

export type ExchangeRateSyncPayload = {
  from_currencies: string[];
  effective_date?: string;
  overwrite_existing: boolean;
};

export type ExchangeRateSyncResponse = {
  provider: string;
  base_currency: string;
  effective_date: string;
  created_count: number;
  updated_count: number;
  skipped_count: number;
  failed_count: number;
  synced_rates: ExchangeRate[];
  skipped_currencies: string[];
  failed_currencies: string[];
};

export type PaginatedExchangeRatesResponse = {
  rows: ExchangeRate[];
  total_count: number;
};
