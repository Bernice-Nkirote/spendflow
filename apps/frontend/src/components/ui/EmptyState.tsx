type Props = {
  title?: string;
  message: string;
};

export default function EmptyState({
  title = "Nothing here yet",
  message,
}: Props) {
  return (
    <div className="rounded-xl border bg-white p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <span className="text-2xl">📄</span>
      </div>

      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{message}</p>
    </div>
  );
}
