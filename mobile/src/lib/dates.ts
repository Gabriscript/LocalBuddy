/// Trip dates travel as plain `YYYY-MM-DD` days, never as instants: a trip "from the 12th" starts
/// on the 12th wherever the phone happens to be.

/// The calendar day in the member's own time zone, as `YYYY-MM-DD`.
export function isoDay(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/// The end of "Free today": the next local midnight, capped at 24 hours because that is all the
/// server accepts (a 25-hour day, when clocks go back, would otherwise be refused).
export function endOfToday(): string {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return new Date(Math.min(midnight.getTime(), now.getTime() + 24 * 3_600_000 - 60_000)).toISOString();
}

/// Today plus a number of days, as `YYYY-MM-DD`.
export function isoDayIn(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return isoDay(date);
}

/// A real calendar day: `2026-02-31` has the right shape and is still not one.
export function isValidDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/// "12 Dec" in the app's language. Read as a local day, so no time zone can shift it.
export function shortDay(value: string, language: string): string {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(language, { day: 'numeric', month: 'short' });
}
