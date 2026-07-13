export function formatCurrency(amount: number): string {
  return `₪${amount.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;
}

// The "budget period" containing `reference` — normally the calendar month, but shifted to
// start on `monthStartDay` instead of the 1st when the user has set a custom budget-reset day
// (e.g. payday). monthStartDay=1 reduces to the plain calendar month.
export function getBudgetPeriod(monthStartDay: number = 1, reference: Date = new Date()) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const start =
    reference.getDate() >= monthStartDay
      ? new Date(year, month, monthStartDay)
      : new Date(year, month - 1, monthStartDay);
  const end = new Date(start.getFullYear(), start.getMonth() + 1, monthStartDay);
  return { start, end };
}

export function isSameMonth(
  isoDate: string,
  reference: Date = new Date(),
  monthStartDay: number = 1
): boolean {
  const d = new Date(isoDate);
  const { start, end } = getBudgetPeriod(monthStartDay, reference);
  return d >= start && d < end;
}

export function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// A sensible default display name for a shared-trip participant, since accounts only have an
// email today (no separate profile-name field) — the part before '@'. Still just a starting
// point the user can edit before sharing/joining a trip.
export function deriveDisplayName(email: string | null | undefined): string {
  if (!email) return 'משתמש';
  const local = email.split('@')[0];
  return local || 'משתמש';
}
