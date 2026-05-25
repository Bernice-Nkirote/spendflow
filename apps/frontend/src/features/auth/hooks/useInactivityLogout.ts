import { useEffect, useRef, useState } from "react";

const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;
const WARNING_BEFORE_LOGOUT_MS = 2 * 60 * 1000;

function clearInternalSession() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("user");
}

function saveCurrentPath() {
  const currentPath =
    window.location.pathname + window.location.search + window.location.hash;

  if (currentPath !== "/login") {
    sessionStorage.setItem("returnToAfterLogin", currentPath);
  }
}

export function useInactivityLogout() {
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
    saveCurrentPath();
    clearInternalSession();
    window.location.href = "/login";
  };

  const resetTimer = () => {
    clearTimers();
    setIsSessionWarningOpen(false);

    warningTimeoutRef.current = window.setTimeout(() => {
      setIsSessionWarningOpen(true);
    }, INACTIVITY_LIMIT_MS - WARNING_BEFORE_LOGOUT_MS);

    logoutTimeoutRef.current = window.setTimeout(() => {
      logoutNow();
    }, INACTIVITY_LIMIT_MS);
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
