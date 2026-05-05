type LoadingStateProps = {
  message?: string;
};

export default function LoadingState({
  message = "Loading...",
}: LoadingStateProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm font-medium text-gray-500 shadow-sm">
      {message}
    </div>
  );
}
