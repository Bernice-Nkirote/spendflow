import type { ReportSummaryCardConfig } from "../types/report.types";

type Props<T> = {
  data: T[];
  totalCount: number;
  cards?: ReportSummaryCardConfig<T>[];
};

function toNumber(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;

  const numberValue = Number(value);
  return Number.isNaN(numberValue) ? 0 : numberValue;
}

function formatValue(value: number, format?: "number" | "currency" | "days") {
  if (format === "currency") {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      maximumFractionDigits: 2,
    }).format(value);
  }

  if (format === "days") {
    return `${value.toFixed(1)} days`;
  }

  return new Intl.NumberFormat("en-KE").format(value);
}

export default function ReportSummaryCards<T>({
  data,
  totalCount,
  cards = [],
}: Props<T>) {
  if (cards.length === 0) return null;

  function calculateCardValue(card: ReportSummaryCardConfig<T>) {
    if (card.type === "count") {
      return totalCount;
    }

    if (!card.field) {
      return 0;
    }

    const values = data
      .map((row) => toNumber(row[card.field as keyof T]))
      .filter((value) => value > 0);

    if (card.type === "average") {
      if (values.length === 0) return 0;

      const total = values.reduce((sum, value) => sum + value, 0);
      return total / values.length;
    }

    return values.reduce((sum, value) => sum + value, 0);
  }

  return (
    <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const value = calculateCardValue(card);

        return (
          <div
            key={card.label}
            className="min-w-0 rounded-xl border bg-white p-4 shadow-sm"
          >
            <p className="truncate text-sm font-medium text-primary-gray">
              {card.label}
            </p>
            <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
              {formatValue(value, card.format)}
            </p>
          </div>
        );
      })}
    </section>
  );
}
