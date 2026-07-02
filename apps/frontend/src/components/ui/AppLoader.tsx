export default function AppLoader() {
  return (
    <div className="loader-glass-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="loader-logo-card flex flex-col items-center px-8 py-7">
        <img
          src="/tendaflow-loading-logo.svg"
          alt="Tendaflow logo"
          className="w-full max-w-[18rem] object-contain sm:max-w-[21rem] md:max-w-[24rem]"
        />

        <p className="mt-2 text-sm font-semibold uppercase tracking-[0.24em] text-[#26658C]">
          Preparing your workspace
        </p>

        <div className="loader-progress mt-5" aria-hidden="true" />
      </div>
    </div>
  );
}