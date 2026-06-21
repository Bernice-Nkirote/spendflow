type SummaryCardProps = {
  title: string;
  value: string | number;
  description: string;
  accentColor: "blue" | "purple" | "red" | "yellow" | "green";
};

const accentColorClasses: Record<SummaryCardProps["accentColor"], string> = {
  blue: "border-l-primary-blue",
  purple: "border-l-purple-700",
  red: "border-l-red-700",
  yellow: "border-l-yellow-500",
  green: "border-l-green-600",
};

export default function SummaryCard({
  title,
  value,
  description,
  accentColor,
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/70 border-l-4 bg-white/75 p-5 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md ${accentColorClasses[accentColor]}`}
    >
      <p className="text-sm font-medium text-primary-gray">{title}</p>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-primary-black sm:text-3xl">
        {value}
      </p>

      <p className="mt-2 text-sm leading-5 text-primary-gray">{description}</p>
    </div>
  );
}
