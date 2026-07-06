import { Expense, Trip, TripTransaction } from './types';

// Fixed day-of-month (not "N days ago") so every sample always lands in the
// current/previous calendar month, regardless of which day it's viewed on.
function dayOfMonth(monthOffset: number, day: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 10, 0, 0).toISOString();
}

export const DEMO_BUDGET = 4500;
export const DEMO_SAVINGS_GOAL = 2000;

export const DEMO_EXPENSES: Expense[] = [
  { id: 'demo-1', amount: 320, category: 'מזון', note: 'סופר', date: dayOfMonth(0, 2) },
  { id: 'demo-2', amount: 150, category: 'תחבורה', note: 'דלק', date: dayOfMonth(0, 5) },
  { id: 'demo-3', amount: 89, category: 'בילויים', note: 'קולנוע', date: dayOfMonth(0, 8) },
  { id: 'demo-4', amount: 450, category: 'קניות', note: '', date: dayOfMonth(0, 1) },
  {
    id: 'demo-7',
    amount: 1800,
    category: 'דיור',
    note: 'שכר דירה',
    date: dayOfMonth(0, 1),
    recurring: true,
  },
  // last month, for the month-over-month insight
  { id: 'demo-5', amount: 200, category: 'מזון', note: 'סופר', date: dayOfMonth(-1, 5) },
  { id: 'demo-6', amount: 140, category: 'תחבורה', note: 'דלק', date: dayOfMonth(-1, 10) },
];

export const DEMO_TRIPS: Trip[] = [
  { id: 'demo-trip-1', name: 'טיול לאילת', budget: 2000, createdAt: dayOfMonth(0, 1) },
];

export const DEMO_TRIP_TRANSACTIONS: Record<string, TripTransaction[]> = {
  'demo-trip-1': [
    { id: 'demo-tx-1', type: 'expense', amount: 450, note: 'מלון', date: dayOfMonth(0, 2) },
    { id: 'demo-tx-2', type: 'expense', amount: 180, note: 'ארוחת ערב', date: dayOfMonth(0, 3) },
    { id: 'demo-tx-3', type: 'fee', amount: 15, note: 'עמלת משיכה', date: dayOfMonth(0, 3) },
    { id: 'demo-tx-4', type: 'reimbursement', amount: 200, note: 'החזר מדני על המלון', date: dayOfMonth(0, 4) },
  ],
};
