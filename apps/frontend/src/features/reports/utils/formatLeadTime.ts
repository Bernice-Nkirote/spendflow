export function formatLeadTime(value?: number | string | null): string {
  if (value === null || value === undefined || value === "") return "-";

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";

  const safeDays = Math.max(0, numericValue);
  const totalMinutes = Math.round(safeDays * 24 * 60);

  if (totalMinutes <= 0) return "Same day";

  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days === 0) {
    if (hours === 0) return `${minutes} min`;
    if (minutes === 0) return `${hours} hr${hours === 1 ? "" : "s"}`;
    return `${hours} hr${hours === 1 ? "" : "s"} ${minutes} min`;
  }

  if (hours === 0 && minutes === 0) {
    return `${days} day${days === 1 ? "" : "s"}`;
  }

  const roundedDays = minutes > 0 || hours > 0 ? days + 1 : days;
  return `${roundedDays} day${roundedDays === 1 ? "" : "s"}`;
}
