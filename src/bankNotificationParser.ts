import { CategoryDef } from './types';

// Pure text-parsing logic only — no native notification-reading code lives here (see
// CLAUDE.md's "Notes for future work" for what's still needed to wire this up on Android).
//
// The exact wording Israeli banking/card apps use varies by bank and changes over time, and none
// of it is documented publicly, so the patterns below are a best-effort guess covering several
// common phrasings (Hapoalim/Leumi/Discount/Mizrahi-style "חיוב"/"עסקה" charge notifications,
// Isracard/CAL/Max-style "בית עסק" merchant wording, Bit-style "קיבלת"/"מחכים לך" P2P credits) —
// tuned against real notification text pasted into the "בדיקת פענוח" dev screen in Settings, but
// still not exhaustive across every bank's exact format.

export type BankNotificationKind = 'charge' | 'credit';

export interface ParsedBankNotification {
  kind: BankNotificationKind;
  amount: number;
  merchant: string | null;
}

const CHARGE_KEYWORDS = ['חיוב', 'חויב', 'חויבת', 'עסקה', 'רכישה', 'בוצע חיוב', 'חיוב בכרטיס'];
const CREDIT_KEYWORDS = [
  'זיכוי',
  'זוכית',
  'זוכה',
  'התקבל',
  'התקבלה',
  'קיבלת',
  'הופקד',
  'הופקדה',
  'העברה אליך',
  'הועבר אליך',
  // Bit's "מחכים לך" (waiting for you) notification fires for a transfer that hasn't been
  // manually accepted yet — treated as an immediate credit rather than waiting for a separate
  // confirmation notification, since in practice the money is already earmarked for the account.
  'מחכים לך',
];

// Israeli bank/card apps sometimes glue Hebrew and Latin/digit text together with no space at
// all (e.g. a real notification seen in the wild: "בית עסקKING MEAT חייב את כרטיסך בסך155.0 שח")
// — insert a space at every Hebrew↔non-Hebrew script boundary before parsing, so merchant names
// and amounts can still be extracted cleanly regardless of spacing.
function insertScriptBoundaries(text: string): string {
  return text.replace(/([֐-׿])([A-Za-z0-9])/g, '$1 $2').replace(/([A-Za-z0-9])([֐-׿])/g, '$1 $2');
}

const AMOUNT_PATTERNS = [
  /([\d,]+(?:\.\d{1,2})?)\s*(?:ש"?ח|שקלים)/,
  /₪\s*([\d,]+(?:\.\d{1,2})?)/,
  /([\d,]+(?:\.\d{1,2})?)\s*₪/,
];

// A captured name stops at the first of: a known "the sentence keeps going" word, a sentence
// delimiter, or end of string — without this, a plain ".+" would swallow the rest of the
// sentence for formats that don't put the merchant/sender name in its own segment (e.g. "בית
// עסק KING MEAT חייב את כרטיסך..." — the name has to stop before "חייב", not run to the end).
// No trailing \b here — JS regex word-boundary is defined only around [A-Za-z0-9_], so it never
// fires next to Hebrew letters and would silently make every one of these stop-words a no-op.
const NAME_STOP = String.raw`(?=\s+(?:חייב|חייבה|בסך|בסכום|בביט|היום|כרטיסך|בכרטיס|כדאי)|[,.:\n]|$)`;

// Tried in order against the full text; the first capture group is the merchant name. "ה?" makes
// the definite article optional so both "בבית העסק" and "בית עסק <name>" (no article, more like
// a "merchant:" label) match the same pattern.
const MERCHANT_PATTERNS = [
  new RegExp(String.raw`בבית\s*ה?עסק\s*:?\s*(.+?)${NAME_STOP}`),
  new RegExp(String.raw`בית\s*ה?עסק\s*:?\s*(.+?)${NAME_STOP}`),
  new RegExp(String.raw`אצל\s+(.+?)${NAME_STOP}`),
  new RegExp(String.raw`ב-([^\s\d][^,.\n]*?)${NAME_STOP}`), // "ב-שופרסל" — avoids matching "ב-89.50" (an amount)
];

// For credits (money received), the sender's name follows the amount — anchored on the currency
// word right before it (not just any "מ" in the text) so a preamble like "מחכים לך 50 ש"ח מדני"
// doesn't accidentally match the "מ" inside "מחכים" instead of the one before the real name.
const SENDER_PATTERNS = [
  new RegExp(String.raw`(?:ש"?ח|₪|שקלים)\s*מ([א-ת].+?)${NAME_STOP}`),
  new RegExp(String.raw`מאת\s+(.+?)${NAME_STOP}`),
];

function parseAmount(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

function cleanName(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw
    .trim()
    .replace(/^[-:]+/, '')
    .replace(/[.,]+$/, '')
    // P2P credits often end with the payment app's own name (e.g. "...מדני כהן בביט") — not
    // part of the sender's name.
    .replace(/\s*ב-?(ביט|Bit|פייבוקס|Paybox)\s*$/i, '')
    .trim();
  return trimmed.length > 0 ? trimmed : null;
}

function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) return parseAmount(match[1]);
  }
  return null;
}

function extractMerchant(text: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = text.match(pattern);
    const cleaned = cleanName(match?.[1]);
    if (cleaned) return cleaned;
  }
  return null;
}

function extractSender(text: string): string | null {
  for (const pattern of SENDER_PATTERNS) {
    const match = text.match(pattern);
    const cleaned = cleanName(match?.[1]);
    if (cleaned) return cleaned;
  }
  return null;
}

// Parses a single bank/card-app notification's text into a charge or credit, or null if the
// text doesn't look like either. Charges become expenses (with a guessed category); credits
// become "החזר" (reimbursement) entries that offset net spending — same distinction used in
// trip mode.
export function parseBankNotification(text: string): ParsedBankNotification | null {
  const normalizedText = insertScriptBoundaries(text);
  const amount = extractAmount(normalizedText);
  if (amount === null) return null;

  const isCredit = CREDIT_KEYWORDS.some((keyword) => normalizedText.includes(keyword));
  const isCharge = CHARGE_KEYWORDS.some((keyword) => normalizedText.includes(keyword));

  if (isCredit && !isCharge) {
    return { kind: 'credit', amount, merchant: extractSender(normalizedText) };
  }
  if (isCharge) {
    return { kind: 'charge', amount, merchant: extractMerchant(normalizedText) };
  }
  return null;
}

// Default-category name → merchant keywords, used only to pick a starting guess. Matched against
// whatever categories the account actually has (which may have been renamed/deleted/added to),
// not this fixed list directly.
const CATEGORY_KEYWORDS: [string, string[]][] = [
  [
    'מזון',
    [
      'סופר',
      'שופרסל',
      'רמי לוי',
      'ויקטורי',
      'יינות ביתן',
      'מקדונלד',
      'פיצה',
      'מסעדה',
      'קפה',
      'ארוחה',
      'טיב טעם',
      'מגה',
      'meat',
      'food',
      'burger',
      'pizza',
      'restaurant',
      'cafe',
      'coffee',
      'kfc',
      'mcdonald',
      'wolt',
      'dominos',
    ],
  ],
  ['תחבורה', ['דלק', 'פנגו', 'דור אלון', 'סונול', 'פז', 'תחנת דלק', 'רכבת', 'אגד', 'גט', 'uber', 'waze', 'חניון', 'חניה']],
  ['דיור', ['שכר דירה', 'ארנונה', 'חשמל', 'מים', 'ועד בית', 'גז']],
  ['בילויים', ['קולנוע', 'סינמה', 'נטפליקס', 'ספוטיפיי', 'בר ', 'פאב', 'תיאטרון', 'הופעה']],
  ['בריאות', ['קופת חולים', 'בית מרקחת', 'סופר פארם', 'רופא', 'מכבי', 'כללית', 'לאומית', 'מאוחדת']],
  ['חשבונות', ['בזק', 'פרטנר', 'סלקום', 'הוט', 'חברת חשמל', 'ביטוח', 'פלאפון']],
  ['קניות', ['זארה', 'איקאה', 'aliexpress', 'amazon', 'קניון', 'ה.אמ', 'זירה']],
];

// Best-effort keyword match against the merchant name from a parsed charge notification,
// returning the *name* of one of the account's actual categories (which may have been renamed
// or recolored, or be a fully custom category, since categories are user-managed — see
// CategoriesScreen). Returns null when nothing matches confidently, leaving category selection
// to the user instead of guessing wrong.
export function guessCategoryFromMerchant(merchant: string | null, categories: CategoryDef[]): string | null {
  if (!merchant || categories.length === 0) return null;
  const normalized = merchant.toLowerCase();
  const byName = new Map(categories.map((c) => [c.name, c.name]));

  // Check every bucket and keep the longest matching keyword (most specific wins) instead of the
  // first bucket in list order — e.g. "סופר פארם" should match its own "סופר פארם" entry under
  // בריאות, not the shorter generic "סופר" keyword under מזון just because that bucket comes first.
  let bestDefaultName: string | null = null;
  let bestKeywordLength = 0;
  for (const [defaultName, keywords] of CATEGORY_KEYWORDS) {
    for (const keyword of keywords) {
      if (keyword.length > bestKeywordLength && normalized.includes(keyword.toLowerCase())) {
        bestDefaultName = defaultName;
        bestKeywordLength = keyword.length;
      }
    }
  }
  if (!bestDefaultName) return null;

  const match = byName.get(bestDefaultName);
  if (match) return match;
  return byName.get('אחר') ?? null;
}
