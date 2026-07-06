import { Category } from './types';

// Pure text-parsing logic only — no native notification-reading code lives here (see the
// bottom of CLAUDE.md's trips section for what's still needed to wire this up on Android).

export type BankNotificationKind = 'charge' | 'credit';

export interface ParsedBankNotification {
  kind: BankNotificationKind;
  amount: number;
  merchant: string | null;
}

const CHARGE_PATTERN = /חויבת\w*\s+ב-?\s*([\d,]+(?:\.\d+)?)\s*ש"?ח(?:\s+ב-?\s*(.+))?/;
const CREDIT_PATTERN = /(?:התקבלה?|התקבל)\s+(?:העברה|זיכוי)(?:\s+(?:של|בסך))?\s*([\d,]+(?:\.\d+)?)\s*ש"?ח/;

function parseAmount(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

function cleanMerchant(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^[-:]+/, '').replace(/[.,]+$/, '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Parses a single bank-app notification's text into a charge or credit, or null if the
// text doesn't match either known shape. Charges become expenses (with a guessed
// category); credits become "החזר" (reimbursement) entries that offset net spending —
// same distinction used in trip mode.
export function parseBankNotification(text: string): ParsedBankNotification | null {
  const chargeMatch = text.match(CHARGE_PATTERN);
  if (chargeMatch) {
    return {
      kind: 'charge',
      amount: parseAmount(chargeMatch[1]),
      merchant: cleanMerchant(chargeMatch[2]),
    };
  }

  const creditMatch = text.match(CREDIT_PATTERN);
  if (creditMatch) {
    return {
      kind: 'credit',
      amount: parseAmount(creditMatch[1]),
      merchant: null,
    };
  }

  return null;
}

const CATEGORY_KEYWORDS: [Category, string[]][] = [
  ['מזון', ['סופר', 'שופרסל', 'רמי לוי', 'ויקטורי', 'יינות ביתן', 'מקדונלד', 'פיצה', 'מסעדה', 'קפה', 'ארוחה', 'טיב טעם', 'מגה']],
  ['תחבורה', ['דלק', 'פנגו', 'דור אלון', 'סונול', 'פז', 'תחנת דלק', 'רכבת', 'אגד', 'גט', 'uber', 'waze', 'חניון', 'חניה']],
  ['דיור', ['שכר דירה', 'ארנונה', 'חשמל', 'מים', 'ועד בית', 'גז']],
  ['בילויים', ['קולנוע', 'סינמה', 'נטפליקס', 'ספוטיפיי', 'בר ', 'פאב', 'תיאטרון', 'הופעה']],
  ['בריאות', ['קופת חולים', 'בית מרקחת', 'סופר פארם', 'רופא', 'מכבי', 'כללית', 'לאומית', 'מאוחדת']],
  ['חשבונות', ['בזק', 'פרטנר', 'סלקום', 'הוט', 'חברת חשמל', 'ביטוח', 'פלאפון']],
  ['קניות', ['זארה', 'איקאה', 'aliexpress', 'amazon', 'קניון', 'ה.אמ', 'זירה']],
];

// Best-effort keyword match against the merchant name from a parsed charge notification;
// falls back to 'אחר' when nothing matches, same as manual entries default to today.
export function guessCategoryFromMerchant(merchant: string | null): Category {
  if (!merchant) return 'אחר';
  const normalized = merchant.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return category;
    }
  }
  return 'אחר';
}
