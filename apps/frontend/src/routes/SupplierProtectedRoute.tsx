import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import supplierAxiosInstance from "../api/supplierAxiosInstance";
import LoadingState from "../components/ui/LoadingState";

function clearSupplierSession() {
  localStorage.removeItem("supplier_access_token");
  localStorage.removeItem("supplier_refresh_token");
  localStorage.removeItem("supplier_user");
}

async function refreshSupplierAccessToken() {
  const refreshToken = localStorage.getItem("supplier_refresh_token");

  if (!refreshToken) {
    throw new Error("Missing supplier refresh token.");
  }

  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/supplier-auth/refresh`,
    {
      refresh_token: refreshToken,
    },
  );

  const newAccessToken = response.data.access_token;
  localStorage.setItem("supplier_access_token", newAccessToken);

  return newAccessToken;
}

function SupplierProtectedRoute() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function restoreSupplierSession() {
      try {
        const accessToken = localStorage.getItem("supplier_access_token");
        const refreshToken = localStorage.getItem("supplier_refresh_token");

        if (!accessToken && !refreshToken) {
          clearSupplierSession();
          setIsAuthenticated(false);
          return;
        }

        if (!accessToken && refreshToken) {
          await refreshSupplierAccessToken();
        }

        const supplierResponse =
          await supplierAxiosInstance.get("/supplier-auth/me");
        localStorage.setItem(
          "supplier_user",
          JSON.stringify(supplierResponse.data),
        );

        setIsAuthenticated(true);
      } catch (error) {
        console.error(error);
        clearSupplierSession();
        setIsAuthenticated(false);
      } finally {
        setIsCheckingSession(false);
      }
    }

    restoreSupplierSession();
  }, []);

  if (isCheckingSession) {
    return <LoadingState message="Restoring supplier session..." />;
  }

  if (!isAuthenticated) {
    const currentPath =
      window.location.pathname + window.location.search + window.location.hash;

    if (currentPath !== "/supplier-login") {
      sessionStorage.setItem("supplierReturnToAfterLogin", currentPath);
    }

    return <Navigate to="/supplier-login" replace />;
  }

  return <Outlet />;
}

export default SupplierProtectedRoute;
