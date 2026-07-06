import { Expense } from './types';

// Fixed day-of-month (not "N days ago") so every sample always lands in the
// current calendar month, regardless of which day it's viewed on.
function dayOfCurrentMonth(day: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), day, 10, 0, 0).toISOString();
}

export const DEMO_BUDGET = 3000;

export const DEMO_EXPENSES: Expense[] = [
  { id: 'demo-1', amount: 320, category: 'מזון', note: 'סופר', date: dayOfCurrentMonth(2) },
  { id: 'demo-2', amount: 150, category: 'תחבורה', note: 'דלק', date: dayOfCurrentMonth(5) },
  { id: 'demo-3', amount: 89, category: 'בילויים', note: 'קולנוע', date: dayOfCurrentMonth(8) },
  { id: 'demo-4', amount: 450, category: 'קניות', note: '', date: dayOfCurrentMonth(1) },
];
