import Card from "../../../components/ui/Card";
import { formatCurrency } from "../../../utils/formatCurrency";

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

function formatValue(
  value: number,
  format?: "number" | "currency" | "days",
  currency = "KES",
) {
  if (format === "currency") {
    return formatCurrency(value, currency);
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
      .map((row) => {
        const primaryValue = row[card.field as keyof T];
        const primaryNumber = toNumber(primaryValue);

        if (primaryNumber > 0) {
          return primaryNumber;
        }

        if (card.fallbackField) {
          return toNumber(row[card.fallbackField as keyof T]);
        }

        return primaryNumber;
      })
      .filter((value) => value > 0);

    if (card.type === "average") {
      if (values.length === 0) return 0;

      const total = values.reduce((sum, value) => sum + value, 0);
      return total / values.length;
    }

    return values.reduce((sum, value) => sum + value, 0);
  }

  function getSummaryCurrency(): string {
    const firstRow = data[0] as Record<string, unknown> | undefined;

    if (firstRow?.base_currency && typeof firstRow.base_currency === "string") {
      return firstRow.base_currency;
    }

    if (firstRow?.currency && typeof firstRow.currency === "string") {
      return firstRow.currency;
    }

    return "KES";
  }

  return (
    <section className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const value = calculateCardValue(card);
        const summaryCurrency = getSummaryCurrency();

        return (
          <Card key={card.label}>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-primary-gray">
                {card.label}
              </p>

              <p className="mt-2 truncate text-2xl font-semibold text-primary-black">
                {formatValue(value, card.format, summaryCurrency)}
              </p>

              {card.format === "currency" && (
                <p className="mt-1 text-xs text-primary-gray">
                  Currency: {summaryCurrency}
                </p>
              )}
            </div>
          </Card>
        );
      })}
    </section>
  );
}
