export default function AppLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#EEF4FF] via-[#DCE7F5] to-[#C9DBF5] px-6 text-center">
      <div className="mb-4 flex items-center justify-center">
        <img
          src="/tendaflow-logo-final-transparent.svg"
          alt="Tendaflow logo"
          className="w-full max-w-[18rem] sm:max-w-[22rem] md:max-w-[24rem] rounded-[2rem] object-contain drop-shadow-[0_20px_45px_rgba(3,37,91,0.32)]"
        />
      </div>

      <p className="text-[1.15rem] font-medium tracking-[0.08em] text-[#274C77]">
        Smart Procurement Management
      </p>

      <div className="mt-5 flex justify-center gap-3">
        <span className="h-3 w-3 animate-bounce rounded-full bg-[#274C77]" />
        <span className="h-3 w-3 animate-bounce rounded-full bg-[#274C77] [animation-delay:150ms]" />
        <span className="h-3 w-3 animate-bounce rounded-full bg-[#274C77] [animation-delay:300ms]" />
      </div>

      <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] text-[#274C77]">
        Preparing your workspace...
      </p>
    </div>
  );
}
