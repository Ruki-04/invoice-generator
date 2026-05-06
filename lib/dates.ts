export function lastDayOfMonth(reference: Date = new Date()): string {
  const date = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function ensureLastDayOfMonth(dateString: string): string {
  if (!dateString) return lastDayOfMonth();
  const [yearStr, monthStr] = dateString.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!year || !month) return lastDayOfMonth();
  return lastDayOfMonth(new Date(year, month - 1, 1));
}
