import { formatCurrency } from "../../../utils/formatCurrency";

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatMoney(value?: string | number | null, currency = "KES") {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return "Not provided";
  }

  return formatCurrency(amount, currency);
}

export function formatQuantity(value?: string | null) {
  if (!value) return "-";

  const quantity = Number(value);

  if (Number.isNaN(quantity)) return value;

  return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(2);
}

export function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();

  link.remove();
  window.URL.revokeObjectURL(url);
}
