import axiosInstance from "../../../api/axiosInstance";
import type {
  ExchangeRate,
  ExchangeRateCreatePayload,
  ExchangeRateSyncPayload,
  ExchangeRateSyncResponse,
  ExchangeRateUpdatePayload,
  PaginatedExchangeRatesResponse,
} from "../types/exchangeRate.types";

export async function getExchangeRates(): Promise<ExchangeRate[]> {
  const response = await axiosInstance.get<ExchangeRate[]>("/exchange-rates/");
  return response.data;
}

export async function getPaginatedExchangeRates({
  skip,
  limit,
}: {
  skip: number;
  limit: number;
}): Promise<PaginatedExchangeRatesResponse> {
  const response = await axiosInstance.get<PaginatedExchangeRatesResponse>(
    "/exchange-rates/paginated",
    {
      params: {
        skip,
        limit,
      },
    },
  );

  return response.data;
}

export async function getExchangeRate(
  exchangeRateId: string,
): Promise<ExchangeRate> {
  const response = await axiosInstance.get<ExchangeRate>(
    `/exchange-rates/${exchangeRateId}`,
  );
  return response.data;
}

export async function createExchangeRate(
  payload: ExchangeRateCreatePayload,
): Promise<ExchangeRate> {
  const response = await axiosInstance.post<ExchangeRate>(
    "/exchange-rates/",
    payload,
  );
  return response.data;
}

export async function updateExchangeRate(
  exchangeRateId: string,
  payload: ExchangeRateUpdatePayload,
): Promise<ExchangeRate> {
  const response = await axiosInstance.put<ExchangeRate>(
    `/exchange-rates/${exchangeRateId}`,
    payload,
  );
  return response.data;
}

export async function deleteExchangeRate(
  exchangeRateId: string,
): Promise<void> {
  await axiosInstance.delete(`/exchange-rates/${exchangeRateId}`);
}

export async function syncTodayExchangeRates(
  payload: ExchangeRateSyncPayload,
): Promise<ExchangeRateSyncResponse> {
  const response = await axiosInstance.post<ExchangeRateSyncResponse>(
    "/exchange-rates/sync-today",
    payload,
  );

  return response.data;
}
