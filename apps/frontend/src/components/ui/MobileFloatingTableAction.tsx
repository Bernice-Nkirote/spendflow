import type { ReactNode } from "react";

type MobileFloatingTableActionProps = {
  isOpen: boolean;
  reference: string;
  label?: string;
  onClose: () => void;
  children: ReactNode;
};

export default function MobileFloatingTableAction({
  isOpen,
  reference,
  label = "Selected item",
  onClose,
  children,
}: MobileFloatingTableActionProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-4 py-3 shadow-2xl lg:hidden">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary-gray">
              {label}
            </p>
            <p className="mt-1 break-words text-sm font-semibold text-primary-black">
              {reference}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1 text-sm font-medium text-primary-gray hover:bg-gray-100 hover:text-primary-black"
            aria-label="Close mobile actions"
          >
            Close
          </button>
        </div>

        <div className="flex flex-wrap justify-end gap-2">{children}</div>
      </div>
    </div>
  );
}
