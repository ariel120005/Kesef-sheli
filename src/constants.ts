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

// Accent/status colors stay constant across both themes — they read fine on
// both a near-black and a near-white surface.
export const BRAND = {
  primary: '#8B5CF6',
  turquoise: '#2DD4BF',
  danger: '#FB7185',
  safe: '#34D399',
  warning: '#FBBF24',
  over: '#FB7185',
};

export interface SurfaceColors {
  background: string;
  card: string;
  cardBorder: string;
  text: string;
  subtext: string;
  border: string;
  chipBackground: string;
  deleteBackground: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

export const DARK_COLORS: SurfaceColors = {
  background: '#0A0A0F',
  card: '#17171F',
  cardBorder: 'rgba(255,255,255,0.06)',
  text: '#F5F5F7',
  subtext: '#93939F',
  border: 'rgba(255,255,255,0.09)',
  chipBackground: 'rgba(255,255,255,0.05)',
  deleteBackground: 'rgba(251,113,133,0.14)',
  statusBarStyle: 'light-content',
};

export const LIGHT_COLORS: SurfaceColors = {
  background: '#F2F3F7',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.06)',
  text: '#15151C',
  subtext: '#6B6B76',
  border: 'rgba(0,0,0,0.09)',
  chipBackground: 'rgba(0,0,0,0.04)',
  deleteBackground: 'rgba(225,29,72,0.10)',
  statusBarStyle: 'dark-content',
};

export const GRADIENTS = {
  primary: ['#2DD4BF', '#8B5CF6'] as const,
  safe: ['#34D399', '#2DD4BF'] as const,
  warning: ['#FBBF24', '#FB923C'] as const,
  over: ['#FB7185', '#E11D48'] as const,
};

// Categorical colors for per-category charts (donut chart), one per entry in
// CATEGORIES, in that fixed order — never reassigned/cycled so a category keeps
// its color everywhere. Chosen as tinted relatives of the app's own turquoise/
// purple/green/rose brand hues (plus a few more to cover all 8 categories) and
// validated for CVD-safe adjacent contrast against both the dark and light card
// surfaces (see the data-viz skill's palette validator).
export const CATEGORY_COLORS: Record<Category, string> = {
  מזון: '#0D9488',
  תחבורה: '#3B82F6',
  דיור: '#7C3AED',
  בילויים: '#E11D48',
  קניות: '#D97706',
  בריאות: '#059669',
  חשבונות: '#4F46E5',
  אחר: '#B45309',
};

export const SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 16,
  elevation: 8,
};
