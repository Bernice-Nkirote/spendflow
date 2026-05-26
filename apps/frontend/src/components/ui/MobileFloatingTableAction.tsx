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
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#B8CCE6] bg-gradient-to-b from-[#E3ECF8] to-[#D3E2F5] px-4 py-3 shadow-[0_-10px_30px_rgba(15,23,42,0.14)] backdrop-blur-sm lg:hidden">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/50 bg-gradient-to-br from-white/95 to-[#EDF3FB] p-3 shadow-[0_10px_28px_rgba(39,76,119,0.16)] backdrop-blur-md">
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
            className="rounded-full bg-[#274C77]/10 px-3 py-1 text-sm font-semibold text-[#274C77] transition hover:bg-[#274C77]/20"
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
