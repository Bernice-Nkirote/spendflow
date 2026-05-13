import { useEffect } from "react";

type FloatingAlertType = "success" | "error" | "warning" | "info";

type FloatingAlertProps = {
  type?: FloatingAlertType;
  message: string;
  onClose: () => void;
  duration?: number;
};

const alertStyles: Record<FloatingAlertType, string> = {
  success: "border-green-200 bg-green-50 text-green-800",
  error: "border-red-200 bg-red-50 text-red-800",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export default function FloatingAlert({
  type = "info",
  message,
  onClose,
  duration = 4000,
}: FloatingAlertProps) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, duration);

    return () => window.clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed right-4 top-20 z-[100] w-[calc(100%-2rem)] max-w-md sm:right-6">
      <div
        className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg ${alertStyles[type]}`}
      >
        <p>{message}</p>

        <button
          type="button"
          onClick={onClose}
          className="text-lg leading-none opacity-70 transition hover:opacity-100"
          aria-label="Close alert"
        >
          ×
        </button>
      </div>
    </div>
  );
}
