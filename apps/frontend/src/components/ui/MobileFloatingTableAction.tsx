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
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-[linear-gradient(135deg,rgba(1,28,64,0.22),rgba(38,101,140,0.18),rgba(167,235,242,0.24))] backdrop-blur-[1.5px] lg:hidden"
        onClick={onClose}
        aria-label="Close mobile actions overlay"
      />

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/70 bg-white/72 px-4 py-3 shadow-[0_-18px_42px_rgba(1,28,64,0.16)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-white/80 bg-white/90 p-3 shadow-[0_14px_34px_rgba(1,28,64,0.16)] backdrop-blur-xl">
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
              className="rounded-full bg-[#26658C]/10 px-3 py-1 text-sm font-semibold text-[#26658C] transition hover:bg-[#A7EBF2]/35"
              aria-label="Close mobile actions"
            >
              Close
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-2">{children}</div>
        </div>
      </div>
    </>
  );
}
