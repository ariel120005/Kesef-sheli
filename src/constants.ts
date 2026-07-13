// A vivid "aurora" accent — cyan through violet to hot pink — used everywhere a "live" UI
// element is needed (buttons, progress-bar fills, selected chips/icons). BRAND.accent is the
// single anchor color for solid (non-gradient) uses like icons/switches/link text;
// GRADIENTS.primary is the full three-stop sweep used for buttons and fills, and stays
// identical between light and dark mode. Semantic status colors (danger/safe/warning/over) are
// separate — they signal meaning (over budget, on track, etc.), not brand identity.
export const BRAND = {
  accent: '#8B5CF6',
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

// Dark mode is the flagship look — a rich, deep violet-black (not neutral) so the vivid aurora
// accent really glows against it — with white text/icons instead of the light palette's black.
export const DARK_COLORS: SurfaceColors = {
  background: '#0B0618',
  card: '#1C1430',
  cardBorder: 'rgba(139,92,246,0.24)',
  text: '#FFFFFF',
  subtext: '#B8A9D9',
  border: 'rgba(139,92,246,0.26)',
  chipBackground: 'rgba(139,92,246,0.13)',
  deleteBackground: 'rgba(244,63,94,0.18)',
  statusBarStyle: 'light-content',
};

export const LIGHT_COLORS: SurfaceColors = {
  background: '#F6F2FF',
  card: '#FFFFFF',
  cardBorder: 'rgba(139,92,246,0.18)',
  text: '#000000',
  subtext: '#6B5C8C',
  border: 'rgba(139,92,246,0.20)',
  chipBackground: 'rgba(139,92,246,0.09)',
  deleteBackground: 'rgba(225,29,72,0.08)',
  statusBarStyle: 'dark-content',
};

// The signature three-stop "aurora" sweep (cyan → violet → pink) used for every CTA/fill — one
// consistent gradient identity reused everywhere rather than a flat single color, for more
// visual energy. The status gradients (safe/warning/over) are separate semantic shades, each
// its own lighter→deeper pair.
export const GRADIENTS = {
  primary: ['#22D3EE', '#8B5CF6', '#EC4899'] as const,
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

// Soft cap on how many people can join one shared trip (see "Shared trips" in CLAUDE.md) — keeps
// the split/settlement UI readable, not a hard technical limit.
export const MAX_TRIP_PARTICIPANTS = 5;

export const SHADOW = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.45,
  shadowRadius: 16,
  elevation: 8,
};
