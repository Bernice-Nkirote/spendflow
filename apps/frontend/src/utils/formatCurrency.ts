export function formatCurrency(
  amount: number,
  currency: string = "KES",
  locale: string = "en-KE",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    // fallback in case of invalid currency/locale
    return `${currency} ${amount.toLocaleString()}`;
  }
}
