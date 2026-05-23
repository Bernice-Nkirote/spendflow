import axios, { type AxiosError, type AxiosRequestConfig } from "axios";

type RetryableSupplierRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
};

const supplierAxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

supplierAxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("supplier_access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

function clearSupplierSession() {
  localStorage.removeItem("supplier_access_token");
  localStorage.removeItem("supplier_refresh_token");
  localStorage.removeItem("supplier_user");
}

supplierAxiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableSupplierRequestConfig;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("supplier_refresh_token");

      if (!refreshToken) {
        clearSupplierSession();
        const currentPath =
          window.location.pathname +
          window.location.search +
          window.location.hash;

        if (currentPath !== "/supplier-login") {
          sessionStorage.setItem("supplierReturnToAfterLogin", currentPath);
        }

        window.location.href = "/supplier-login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/supplier-auth/refresh`,
          {
            refresh_token: refreshToken,
          },
        );

        const newAccessToken = response.data.access_token;

        localStorage.setItem("supplier_access_token", newAccessToken);

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };

        return supplierAxiosInstance(originalRequest);
      } catch (refreshError) {
        clearSupplierSession();
        const currentPath =
          window.location.pathname +
          window.location.search +
          window.location.hash;

        if (currentPath !== "/supplier-login") {
          sessionStorage.setItem("supplierReturnToAfterLogin", currentPath);
        }

        window.location.href = "/supplier-login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default supplierAxiosInstance;
