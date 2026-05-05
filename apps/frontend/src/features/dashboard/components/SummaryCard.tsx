type SummaryCardProps = {
  title: string;
  value: string | number;
  description: string;
  accentColor: "purple" | "red" | "yellow" | "green";
};

const accentColorClasses: Record<SummaryCardProps["accentColor"], string> = {
  purple: "border-l-purple-700 bg-purple-50/40",
  red: "border-l-red-700 bg-red-50/40",
  yellow: "border-l-yellow-500 bg-yellow-50/40",
  green: "border-l-green-600 bg-green-50/40",
};

export default function SummaryCard({
  title,
  value,
  description,
  accentColor,
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-xl border border-l-4 border-gray-200 border-1-4 p-5 shadow-sm transition hover:shadow-md ${accentColorClasses[accentColor]}`}
    >
      <p className="text-sm font-medium text-gray-500">{title}</p>

      <p className="mt-3 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl xl:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  );
}
