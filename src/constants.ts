// A single teal-green accent used everywhere a "live" UI color is needed (buttons, progress
// bars, selected icons) — the whole app is built around this one hue rather than a second brand
// color, so it stays visually identical between light and dark mode. Semantic status colors
// (danger/safe/warning/over) are separate — they signal meaning (over budget, on track, etc.),
// not brand identity — and are pitched a shade deeper than a typical pastel so they still read
// clearly as text against a pure-white surface, not just as icon tints.
export const BRAND = {
  accent: '#0D9488',
  danger: '#E11D48',
  safe: '#059669',
  warning: '#D97706',
  over: '#E11D48',
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

// Dark mode inverts the light palette below's text/surface roles (white text instead of black),
// but the background/card itself is a deep indigo-black rather than literal pure black — the
// original dark-mode tone this app launched with — so it stays tied together with the shared
// BRAND.accent color above rather than the harsher, flatter look of true #000000.
export const DARK_COLORS: SurfaceColors = {
  background: '#0A0A0F',
  card: '#17171F',
  cardBorder: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  subtext: '#A3A3AD',
  border: 'rgba(255,255,255,0.14)',
  chipBackground: 'rgba(255,255,255,0.06)',
  deleteBackground: 'rgba(225,29,72,0.18)',
  statusBarStyle: 'light-content',
};

export const LIGHT_COLORS: SurfaceColors = {
  background: '#FFFFFF',
  card: '#FFFFFF',
  cardBorder: 'rgba(0,0,0,0.10)',
  text: '#000000',
  subtext: '#5C5C66',
  border: 'rgba(0,0,0,0.12)',
  chipBackground: 'rgba(0,0,0,0.045)',
  deleteBackground: 'rgba(225,29,72,0.08)',
  statusBarStyle: 'dark-content',
};

// Two-stop gradients built from a single hue (never a second, different color) so CTAs keep a
// bit of shine/depth without contradicting the one-accent-color design. The status gradients
// (safe/warning/over) are separate semantic shades, each its own lighter→deeper pair.
export const GRADIENTS = {
  primary: ['#14B8A6', '#0D9488'] as const,
  safe: ['#10B981', '#059669'] as const,
  warning: ['#F59E0B', '#D97706'] as const,
  over: ['#F43F5E', '#E11D48'] as const,
};

// Categories are user-managed (add/rename/recolor/delete — see CategoriesScreen), not a fixed
// list, so this is only the starting set a brand-new account (or demo mode) is seeded with.
// Colors are tinted relatives of the app's own turquoise/purple/green/rose brand hues, validated
// for CVD-safe adjacent contrast against both the dark and light card surfaces (see the data-viz
// skill's palette validator) — also offered as the swatch choices when picking a category color.
export const DEFAULT_CATEGORIES: { name: string; color: string }[] = [
  { name: 'מזון', color: '#0D9488' },
  { name: 'תחבורה', color: '#3B82F6' },
  { name: 'דיור', color: '#7C3AED' },
  { name: 'בילויים', color: '#E11D48' },
  { name: 'קניות', color: '#D97706' },
  { name: 'בריאות', color: '#059669' },
  { name: 'חשבונות', color: '#4F46E5' },
  { name: 'אחר', color: '#B45309' },
];

export const CATEGORY_COLOR_SWATCHES: string[] = [
  ...DEFAULT_CATEGORIES.map((c) => c.color),
  '#0EA5E9',
  '#DB2777',
  '#65A30D',
  '#EA580C',
];

// Fallback for a category whose color is somehow missing (shouldn't normally happen).
export const FALLBACK_CATEGORY_COLOR = '#6B7280';

export const SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 16,
  elevation: 8,
};
