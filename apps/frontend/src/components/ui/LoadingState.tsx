type LoadingStateProps = {
  message?: string;
  fullScreen?: boolean;
};

export default function LoadingState({
  message = "Loading...",
  fullScreen = false,
}: LoadingStateProps) {
  const content = (
    <div className="flex w-full max-w-sm flex-col items-center rounded-3xl border border-white/75 bg-white/82 px-6 py-5 text-center shadow-[0_20px_52px_rgba(1,28,64,0.10)] ring-1 ring-[#A7EBF2]/35 backdrop-blur-xl">
      <p className="text-sm font-semibold text-[#011C40]">{message}</p>
      <div className="loader-progress mt-4" aria-hidden="true" />
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className="loader-glass-bg flex min-h-screen items-center justify-center px-6 text-center"
        role="status"
        aria-live="polite"
      >
        {content}
      </div>
    );
  }

  return (
    <div className="flex justify-center py-4" role="status" aria-live="polite">
      {content}
    </div>
  );
}
