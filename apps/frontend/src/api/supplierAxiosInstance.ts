import axios from "axios";

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

supplierAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("supplier_access_token");
      window.location.href = "/supplier-login";
    }

    return Promise.reject(error);
  },
);

export default supplierAxiosInstance;
