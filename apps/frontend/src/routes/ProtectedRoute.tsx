import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

import axiosInstance from "../api/axiosInstance";
import LoadingState from "../components/ui/LoadingState";
import {
  clearInternalSession,
  hasSessionExpiredByInactivity,
  saveCurrentPathForLogin,
  updateLastActivity,
} from "../features/auth/utils/authSession";

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    throw new Error("Missing refresh token.");
  }

  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
    {
      refresh_token: refreshToken,
    },
  );

  const newAccessToken = response.data.access_token;
  localStorage.setItem("access_token", newAccessToken);

  return newAccessToken;
}

function ProtectedRoute() {
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function restoreSession() {
      try {
        const accessToken = localStorage.getItem("access_token");
        const refreshToken = localStorage.getItem("refresh_token");

        if (hasSessionExpiredByInactivity()) {
          saveCurrentPathForLogin();
          clearInternalSession();
          setIsAuthenticated(false);
          return;
        }

        if (!accessToken && !refreshToken) {
          clearInternalSession();
          setIsAuthenticated(false);
          return;
        }

        if (!accessToken && refreshToken) {
          await refreshAccessToken();
        }

        const userResponse = await axiosInstance.get("/auth/me");
        localStorage.setItem("user", JSON.stringify(userResponse.data));
        updateLastActivity();

        setIsAuthenticated(true);
      } catch (error) {
        console.error(error);
        clearInternalSession();
        setIsAuthenticated(false);
      } finally {
        setIsCheckingSession(false);
      }
    }

    restoreSession();
  }, []);

  if (isCheckingSession) {
    return <LoadingState message="Restoring your session..." fullScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
