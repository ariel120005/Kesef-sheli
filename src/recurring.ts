import { Expense } from './types';
import { isSameMonth } from './utils';

function recurringKey(e: Expense): string {
  return `${e.category}|${e.note}|${e.amount}`;
}

// For each distinct recurring "series" (same category+note+amount, marked recurring),
// returns its latest instance if that instance is from a previous calendar month — i.e.
// this month's copy hasn't been auto-logged yet.
export function findMissingRecurringInstances(expenses: Expense[], now: Date = new Date()): Expense[] {
  const latestByKey = new Map<string, Expense>();
  for (const e of expenses) {
    if (!e.recurring) continue;
    const key = recurringKey(e);
    const current = latestByKey.get(key);
    if (!current || new Date(e.date) > new Date(current.date)) {
      latestByKey.set(key, e);
    }
  }
  return [...latestByKey.values()].filter((latest) => !isSameMonth(latest.date, now));
}
