export type Category =
  | 'מזון'
  | 'תחבורה'
  | 'דיור'
  | 'בילויים'
  | 'קניות'
  | 'בריאות'
  | 'חשבונות'
  | 'אחר';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  note: string;
  date: string; // ISO string
  recurring?: boolean;
  autoDetected?: boolean;
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
  amount: number;
  note: string;
  date: string; // ISO string
  autoDetected?: boolean;
}
