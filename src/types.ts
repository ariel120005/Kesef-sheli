export type Category =
  | 'מזון'
  | 'תחבורה'
  | 'דיור'
  | 'בילויים'
  | 'קניות'
  | 'בריאות'
  | 'חשבונות'
  | 'אחר';

export type Currency = 'USD' | 'EUR' | 'THB' | 'VND';

export interface Expense {
  id: string;
  amount: number; // always in ILS
  category: Category;
  note: string;
  date: string; // ISO string
  recurring?: boolean;
  autoDetected?: boolean;
  // Set when the expense was entered in a foreign currency; `amount` above is still the
  // converted ILS value, these preserve what was actually paid on the receipt.
  originalAmount?: number | null;
  originalCurrency?: Currency | null;
}

export type TabKey = 'profile' | 'home' | 'trips' | 'settings';

export interface Trip {
  id: string;
  name: string;
  budget: number;
  createdAt: string; // ISO string
}

export type TripTransactionType = 'expense' | 'reimbursement' | 'fee';

export interface TripTransaction {
  id: string;
  type: TripTransactionType;
  amount: number; // always in ILS
  note: string;
  date: string; // ISO string
  autoDetected?: boolean;
  // Set when the transaction was entered in a foreign currency; `amount` above is still the
  // converted ILS value, these preserve what was actually paid on the receipt.
  originalAmount?: number | null;
  originalCurrency?: Currency | null;
}
