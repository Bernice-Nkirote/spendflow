import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import Button from "./Button";

type ConfirmDialogVariant = "danger" | "warning" | "info";

type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const variantStyles: Record<ConfirmDialogVariant, string> = {
  danger: "bg-red-50 text-red-700",
  warning: "bg-yellow-50 text-yellow-700",
  info: "bg-blue-50 text-blue-700",
};

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "info",
  isLoading = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmVariant = variant === "danger" ? "danger" : "primary";

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div
          className={`mb-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${variantStyles[variant]}`}
        >
          Confirmation required
        </div>

        <h2 className="text-lg font-semibold text-primary-black">{title}</h2>

        <div className="mt-2 text-sm leading-6 text-gray-600">{message}</div>

        {errorMessage && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>

          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
            className="min-w-[110px]"
          >
            {isLoading ? "Processing..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ConfirmDialog;
