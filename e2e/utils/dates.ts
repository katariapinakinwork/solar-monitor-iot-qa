// yyyy-MM-dd in UTC, offset by a number of days. The app calculates "today" in UTC.
export function utcDate(offsetDays = 0): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}