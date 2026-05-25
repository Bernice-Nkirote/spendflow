import axiosInstance from "../../../api/axiosInstance";
import type { GlobalSearchResponse } from "../types/globalSearch.types";

export async function searchGlobal(
  query: string,
  limit = 5,
): Promise<GlobalSearchResponse> {
  const response = await axiosInstance.get<GlobalSearchResponse>(
    "/global-search/",
    {
      params: {
        q: query,
        limit,
      },
    },
  );

  return response.data;
}
