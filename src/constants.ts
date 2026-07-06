import { Category } from './types';

export const CATEGORIES: Category[] = [
  'מזון',
  'תחבורה',
  'דיור',
  'בילויים',
  'קניות',
  'בריאות',
  'חשבונות',
  'אחר',
];

export const STORAGE_KEYS = {
  expenses: '@kesef_sheli/expenses',
  budget: '@kesef_sheli/budget',
};

export const COLORS = {
  background: '#0A0A0F',
  card: '#17171F',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#F5F5F7',
  subtext: '#93939F',
  border: 'rgba(255,255,255,0.09)',
  primary: '#8B5CF6',
  turquoise: '#2DD4BF',
  danger: '#FB7185',
  safe: '#34D399',
  warning: '#FBBF24',
  over: '#FB7185',
  chipBackground: 'rgba(255,255,255,0.05)',
  deleteBackground: 'rgba(251,113,133,0.14)',
};

export const GRADIENTS = {
  primary: ['#2DD4BF', '#8B5CF6'] as const,
  safe: ['#34D399', '#2DD4BF'] as const,
  warning: ['#FBBF24', '#FB923C'] as const,
  over: ['#FB7185', '#E11D48'] as const,
};

export const SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 16,
  elevation: 8,
};
