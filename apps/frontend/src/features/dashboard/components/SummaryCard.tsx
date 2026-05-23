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
      className={`rounded-xl border border-gray-200 border-l-4 p-5 shadow-sm ${accentColorClasses[accentColor]}`}
    >
      <p className="text-sm font-medium text-primary-gray">{title}</p>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-primary-black sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-sm leading-5 text-primary-gray">{description}</p>
    </div>
  );
}
