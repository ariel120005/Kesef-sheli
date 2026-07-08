import { DEFAULT_CATEGORIES } from './constants';
import { CategoryDef, Expense, Trip, TripTransaction } from './types';

// Fixed day-of-month (not "N days ago") so every sample always lands in the
// current/previous calendar month, regardless of which day it's viewed on.
function dayOfMonth(monthOffset: number, day: number): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + monthOffset, day, 10, 0, 0).toISOString();
}

export const DEMO_BUDGET = 4500;
export const DEMO_SAVINGS_GOAL = 2000;

export const DEMO_CATEGORIES: CategoryDef[] = DEFAULT_CATEGORIES.map((c, index) => ({
  id: `demo-cat-${index}`,
  name: c.name,
  color: c.color,
}));

export const DEMO_EXPENSES: Expense[] = [
  {
    id: 'demo-1',
    amount: 320,
    category: 'מזון',
    note: 'סופר',
    date: dayOfMonth(0, 2),
    location: { lat: 32.0809, lng: 34.7806 },
  },
  {
    id: 'demo-2',
    amount: 150,
    category: 'תחבורה',
    note: 'דלק',
    date: dayOfMonth(0, 5),
    location: { lat: 32.0685, lng: 34.7825 },
  },
  {
    id: 'demo-3',
    amount: 89,
    category: 'בילויים',
    note: 'קולנוע',
    date: dayOfMonth(0, 8),
    location: { lat: 32.0754, lng: 34.7741 },
  },
  {
    id: 'demo-4',
    amount: 450,
    category: 'קניות',
    note: 'איקאה',
    date: dayOfMonth(0, 1),
    location: { lat: 32.0455, lng: 34.8172 },
  },
  {
    id: 'demo-7',
    amount: 1800,
    category: 'דיור',
    note: 'שכר דירה',
    date: dayOfMonth(0, 1),
    recurring: true,
  },
  {
    id: 'demo-8',
    amount: 92.5,
    category: 'קניות',
    note: 'רכישה באתר אמריקאי',
    date: dayOfMonth(0, 6),
    originalAmount: 25,
    originalCurrency: 'USD',
  },
  // last month, for the month-over-month insight
  { id: 'demo-5', amount: 200, category: 'מזון', note: 'סופר', date: dayOfMonth(-1, 5) },
  { id: 'demo-6', amount: 140, category: 'תחבורה', note: 'דלק', date: dayOfMonth(-1, 10) },
];

export const DEMO_TRIPS: Trip[] = [
  { id: 'demo-trip-1', name: 'טיול לאילת', budget: 2000, createdAt: dayOfMonth(0, 1) },
  { id: 'demo-trip-2', name: 'טיול לבנגקוק', budget: 5000, createdAt: dayOfMonth(-1, 14) },
];

export const DEMO_TRIP_TRANSACTIONS: Record<string, TripTransaction[]> = {
  'demo-trip-1': [
    { id: 'demo-tx-1', type: 'expense', amount: 450, note: 'מלון', date: dayOfMonth(0, 2) },
    { id: 'demo-tx-2', type: 'expense', amount: 180, note: 'ארוחת ערב', date: dayOfMonth(0, 3) },
    { id: 'demo-tx-3', type: 'fee', amount: 15, note: 'עמלת משיכה', date: dayOfMonth(0, 3) },
    { id: 'demo-tx-4', type: 'reimbursement', amount: 200, note: 'החזר מדני על המלון', date: dayOfMonth(0, 4) },
  ],
  'demo-trip-2': [
    {
      id: 'demo-tx-5',
      type: 'expense',
      amount: 370,
      note: 'מלון',
      date: dayOfMonth(-1, 15),
      originalAmount: 100,
      originalCurrency: 'USD',
    },
    {
      id: 'demo-tx-6',
      type: 'expense',
      amount: 120,
      note: 'ארוחת ערב',
      date: dayOfMonth(-1, 16),
      originalAmount: 1200,
      originalCurrency: 'THB',
    },
    { id: 'demo-tx-7', type: 'fee', amount: 12, note: 'עמלת משיכה', date: dayOfMonth(-1, 15) },
    { id: 'demo-tx-8', type: 'reimbursement', amount: 150, note: 'החזר מרוני על הטיסה', date: dayOfMonth(-1, 17) },
  ],
};
