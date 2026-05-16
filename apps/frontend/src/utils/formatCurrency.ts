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

export function formatCurrency(
  amount: number,
  currency: string = "KES",
  locale: string = "en-KE",
): string {
  const safeCurrency = normalizeCurrencyCode(currency);
  const safeAmount = Number.isNaN(amount) ? 0 : amount;

  return `${safeCurrency} ${safeAmount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
