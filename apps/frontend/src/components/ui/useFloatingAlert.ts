import { useEffect, useState } from "react";

export type FloatingAlertType = "success" | "error" | "warning" | "info";

type FloatingAlertState = {
  type: FloatingAlertType;
  message: string;
};

export function useFloatingAlert(duration = 5000) {
  const [alert, setAlert] = useState<FloatingAlertState | null>(null);

  function showAlert(type: FloatingAlertType, message: string) {
    setAlert({ type, message });
  }

  function clearAlert() {
    setAlert(null);
  }

  useEffect(() => {
    if (!alert) return;

    const timer = window.setTimeout(() => {
      setAlert(null);
    }, duration);

    return () => window.clearTimeout(timer);
  }, [alert, duration]);

  return {
    alert,
    showAlert,
    clearAlert,
  };
}
