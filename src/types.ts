// A free-text category name — categories are user-managed (see CategoryDef below), not a fixed
// list, so this is no longer a literal union.
export type Category = string;

export interface CategoryDef {
  id: string;
  name: string;
  color: string;
}

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
  // Optional — only set for expenses tied to a physical place (e.g. picked on the Map tab's
  // search), so they can be shown as pins. Most expenses have no location.
  location?: { lat: number; lng: number } | null;
}

export type TabKey = 'map' | 'home' | 'insights';

export type OverlayScreen = 'profileMenu' | 'settings' | 'account' | 'trips' | 'savingsGoal' | 'categories';

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
