// A free-text category name — categories are user-managed (see CategoryDef below), not a fixed
// list, so this is no longer a literal union.
export type Category = string;

export interface CategoryDef {
  id: string;
  name: string;
  color: string;
}

export type Currency =
  | 'USD'
  | 'EUR'
  | 'GBP'
  | 'JPY'
  | 'CHF'
  | 'CAD'
  | 'AUD'
  | 'NZD'
  | 'CNY'
  | 'HKD'
  | 'SGD'
  | 'INR'
  | 'KRW'
  | 'THB'
  | 'VND'
  | 'PHP'
  | 'IDR'
  | 'MYR'
  | 'TRY'
  | 'RUB'
  | 'PLN'
  | 'CZK'
  | 'HUF'
  | 'RON'
  | 'BGN'
  | 'SEK'
  | 'NOK'
  | 'DKK'
  | 'ISK'
  | 'UAH'
  | 'ZAR'
  | 'EGP'
  | 'JOD'
  | 'AED'
  | 'SAR'
  | 'QAR'
  | 'KWD'
  | 'BHD'
  | 'OMR'
  | 'LBP'
  | 'BRL'
  | 'MXN'
  | 'ARS'
  | 'CLP'
  | 'COP'
  | 'PEN'
  | 'PKR'
  | 'BDT'
  | 'LKR'
  | 'NPR'
  | 'GEL'
  | 'AZN'
  | 'KZT'
  | 'MAD'
  | 'TND';

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

export type OverlayScreen =
  | 'profileMenu'
  | 'settings'
  | 'account'
  | 'trips'
  | 'savingsGoal'
  | 'categories'
  | 'parseTest'
  | 'notificationSources'
  | 'about';

// One app the (future) native notification listener is allowed to read — everything else must
// be discarded unread. `enabled` defaults to false for every source, including presets: the user
// must actively opt in per app, nothing is approved by default.
export interface NotificationSource {
  id: string;
  packageName: string;
  label: string;
  enabled: boolean;
  isPreset: boolean;
}

// One person in a shared trip (see Trip.participants below). `uid` is the Firebase Auth uid in
// real accounts, or a synthetic id (e.g. 'demo-dana') in demo mode — either way it's what
// TripTransaction.paidByUid/splitAmongUids reference.
export interface TripParticipant {
  uid: string;
  displayName: string;
  joinedAt: string; // ISO string
}

export interface Trip {
  id: string;
  name: string;
  budget: number;
  createdAt: string; // ISO string
  // Set when the trip is marked finished via "סיים טיול" — once set, the trip summary (final
  // gross/net spend, days, daily average) becomes permanently viewable, and stays that way even
  // after the trip is closed (it never reverts to unset).
  endedAt?: string | null;
  // A shared trip (see "Shared trips" in CLAUDE.md) — absent/false means a personal trip, the
  // original (and still default) behavior. Once shared, `joinCode`/`ownerUid`/`participants` are
  // always set; they never revert even if participants later leave (not supported yet).
  isShared?: boolean;
  joinCode?: string | null; // 6 digits, unique among currently-shared trips
  ownerUid?: string | null; // who created the trip / turned it into a shared one
  participants?: TripParticipant[];
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
  // Shared-expense splitting (see src/debtSimplification.ts) — only ever set on a 'expense'
  // transaction inside a shared trip, when it was logged as "for everyone". paidByUid is who
  // actually paid; splitAmongUids is a snapshot of the participant uids splitting it equally,
  // taken at creation time so later joiners don't retroactively change past expenses' math.
  // Both stay untouched (not editable) once the transaction is created.
  paidByUid?: string | null;
  splitAmongUids?: string[] | null;
}
