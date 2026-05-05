type ErrorStateProps = {
  message: string;
};

export default function ErrorState({ message }: ErrorStateProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-700 shadow-sm">
      {message}
    </div>
  );
}
