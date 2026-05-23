import { useEffect, useRef, useState } from "react";

const SUPPLIER_INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const SUPPLIER_WARNING_BEFORE_LOGOUT_MS = 2 * 60 * 1000;

function clearSupplierSession() {
  localStorage.removeItem("supplier_access_token");
  localStorage.removeItem("supplier_refresh_token");
  localStorage.removeItem("supplier_user");
}

function saveCurrentSupplierPath() {
  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;

  if (currentPath !== "/supplier-login") {
    sessionStorage.setItem("supplierReturnToAfterLogin", currentPath);
  }
}

export function useSupplierInactivityLogout() {
  const [isSessionWarningOpen, setIsSessionWarningOpen] = useState(false);

  const warningTimeoutRef = useRef<number | null>(null);
  const logoutTimeoutRef = useRef<number | null>(null);

  const clearTimers = () => {
    if (warningTimeoutRef.current) {
      window.clearTimeout(warningTimeoutRef.current);
    }

    if (logoutTimeoutRef.current) {
      window.clearTimeout(logoutTimeoutRef.current);
    }
  };

  const logoutNow = () => {
    saveCurrentSupplierPath();
    clearSupplierSession();
    window.location.href = "/supplier-login";
  };

  const resetTimer = () => {
    clearTimers();
    setIsSessionWarningOpen(false);

    warningTimeoutRef.current = window.setTimeout(() => {
      setIsSessionWarningOpen(true);
    }, SUPPLIER_INACTIVITY_LIMIT_MS - SUPPLIER_WARNING_BEFORE_LOGOUT_MS);

    logoutTimeoutRef.current = window.setTimeout(() => {
      logoutNow();
    }, SUPPLIER_INACTIVITY_LIMIT_MS);
  };

  const staySignedIn = () => {
    resetTimer();
  };

  useEffect(() => {
    const activityEvents = ["click", "keydown", "scroll", "touchstart"];

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer);
    });

    resetTimer();

    return () => {
      clearTimers();

      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, []);

  return {
    isSessionWarningOpen,
    staySignedIn,
    logoutNow,
  };
}
