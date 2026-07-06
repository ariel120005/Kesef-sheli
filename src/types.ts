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
}

export type TabKey = 'profile' | 'home' | 'settings';
