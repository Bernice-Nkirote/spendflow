export type CurrencyOption = {
  code: string;
  label: string;
};

export const currencyOptions: CurrencyOption[] = [
  { code: "KES", label: "Kenyan Shilling (KES)" },
  { code: "USD", label: "US Dollar (USD)" },
  { code: "EUR", label: "Euro (EUR)" },
  { code: "GBP", label: "British Pound (GBP)" },
  { code: "HUF", label: "Hungarian Forint (HUF)" },
  { code: "TZS", label: "Tanzanian Shilling (TZS)" },
  { code: "UGX", label: "Ugandan Shilling (UGX)" },
  { code: "RWF", label: "Rwandan Franc (RWF)" },
  { code: "ZAR", label: "South African Rand (ZAR)" },
];

export function isSupportedCurrency(currency: string) {
  return currencyOptions.some((option) => option.code === currency);
}
