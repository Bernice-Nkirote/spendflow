export function normalizeCurrencyCode(
  currency: string | null | undefined,
): string {
  if (!currency) return "KES";

  const normalized = currency.toUpperCase().trim();

  const bracketMatch = normalized.match(/\(([A-Z]{3})\)/);

  if (bracketMatch?.[1]) {
    return bracketMatch[1];
  }

  const repeatedCodeMatch = normalized.match(/^([A-Z]{3})\1$/);

  if (repeatedCodeMatch?.[1]) {
    return repeatedCodeMatch[1];
  }

  if (/^[A-Z]{3}$/.test(normalized)) {
    return normalized;
  }

  return "KES";
}

const currencySymbolOverrides: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  KES: "Ksh",
};

export function formatCurrency(
  amount: number,
  currency: string = "KES",
  locale: string = "en-KE",
): string {
  const safeCurrency = normalizeCurrencyCode(currency);
  const safeAmount = Number.isNaN(amount) ? 0 : amount;

  const symbolOverride = currencySymbolOverrides[safeCurrency];

  if (symbolOverride) {
    return `${symbolOverride}${safeAmount.toLocaleString(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: safeCurrency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
    }).format(safeAmount);
  } catch {
    return `${safeCurrency} ${safeAmount.toLocaleString(locale)}`;
  }
}
