import { Currency } from './types';

export interface CurrencyOption {
  code: Currency;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'דולר אמריקאי', symbol: '$' },
  { code: 'EUR', label: 'יורו', symbol: '€' },
  { code: 'GBP', label: 'לירה שטרלינג', symbol: '£' },
  { code: 'JPY', label: 'ין יפני', symbol: '¥' },
  { code: 'CHF', label: 'פרנק שוויצרי', symbol: 'CHF' },
  { code: 'CAD', label: 'דולר קנדי', symbol: '$' },
  { code: 'AUD', label: 'דולר אוסטרלי', symbol: '$' },
  { code: 'NZD', label: 'דולר ניו זילנדי', symbol: '$' },
  { code: 'CNY', label: 'יואן סיני', symbol: '¥' },
  { code: 'HKD', label: 'דולר הונג קונגי', symbol: '$' },
  { code: 'SGD', label: 'דולר סינגפורי', symbol: '$' },
  { code: 'INR', label: 'רופי הודי', symbol: '₹' },
  { code: 'KRW', label: 'וון דרום קוריאני', symbol: '₩' },
  { code: 'THB', label: 'באט תאילנדי', symbol: '฿' },
  { code: 'VND', label: 'דונג וייטנאמי', symbol: '₫' },
  { code: 'PHP', label: 'פסו פיליפיני', symbol: '₱' },
  { code: 'IDR', label: 'רופיה אינדונזית', symbol: 'Rp' },
  { code: 'MYR', label: 'רינגיט מלזי', symbol: 'RM' },
  { code: 'TRY', label: 'לירה טורקית', symbol: '₺' },
  { code: 'RUB', label: 'רובל רוסי', symbol: '₽' },
  { code: 'PLN', label: 'זלוטי פולני', symbol: 'zł' },
  { code: 'CZK', label: "כתר צ'כי", symbol: 'Kč' },
  { code: 'HUF', label: 'פורינט הונגרי', symbol: 'Ft' },
  { code: 'RON', label: 'ליי רומני', symbol: 'lei' },
  { code: 'BGN', label: 'לב בולגרי', symbol: 'лв' },
  { code: 'SEK', label: 'כתר שוודי', symbol: 'kr' },
  { code: 'NOK', label: 'כתר נורווגי', symbol: 'kr' },
  { code: 'DKK', label: 'כתר דני', symbol: 'kr' },
  { code: 'ISK', label: 'כתר איסלנדי', symbol: 'kr' },
  { code: 'UAH', label: 'גריבנה אוקראינית', symbol: '₴' },
  { code: 'ZAR', label: 'ראנד דרום אפריקאי', symbol: 'R' },
  { code: 'EGP', label: 'לירה מצרית', symbol: '£E' },
  { code: 'JOD', label: 'דינר ירדני', symbol: 'د.א' },
  { code: 'AED', label: 'דירהם איחוד האמירויות', symbol: 'د.إ' },
  { code: 'SAR', label: 'ריאל סעודי', symbol: '﷼' },
  { code: 'QAR', label: 'ריאל קטארי', symbol: 'ر.ق' },
  { code: 'KWD', label: 'דינר כוויתי', symbol: 'د.ك' },
  { code: 'BHD', label: 'דינר בחריני', symbol: '.د.ب' },
  { code: 'OMR', label: 'ריאל עומאני', symbol: 'ر.ع.' },
  { code: 'LBP', label: 'לירה לבנונית', symbol: 'ل.ل' },
  { code: 'BRL', label: 'ריאל ברזילאי', symbol: 'R$' },
  { code: 'MXN', label: 'פסו מקסיקני', symbol: '$' },
  { code: 'ARS', label: 'פסו ארגנטינאי', symbol: '$' },
  { code: 'CLP', label: "פסו צ'יליאני", symbol: '$' },
  { code: 'COP', label: 'פסו קולומביאני', symbol: '$' },
  { code: 'PEN', label: 'סול פרואני', symbol: 'S/' },
  { code: 'PKR', label: 'רופי פקיסטני', symbol: '₨' },
  { code: 'BDT', label: 'טאקה בנגלדשי', symbol: '৳' },
  { code: 'LKR', label: 'רופי סרי לנקי', symbol: 'Rs' },
  { code: 'NPR', label: 'רופי נפאלי', symbol: 'Rs' },
  { code: 'GEL', label: 'לארי גאורגי', symbol: '₾' },
  { code: 'AZN', label: "מנאט אזרבייג'ני", symbol: '₼' },
  { code: 'KZT', label: 'טנגה קזחי', symbol: '₸' },
  { code: 'MAD', label: 'דירהם מרוקאי', symbol: 'د.م.' },
  { code: 'TND', label: 'דינר תוניסאי', symbol: 'د.ت' },
];

// Approximate rates to ILS, used only when the live-rate fetch below fails (e.g. no network) —
// good enough to keep the app usable offline, not meant to stay accurate over time.
const FALLBACK_RATES_TO_ILS: Record<Currency, number> = {
  USD: 3.7,
  EUR: 4.0,
  GBP: 4.7,
  JPY: 0.025,
  CHF: 4.2,
  CAD: 2.7,
  AUD: 2.4,
  NZD: 2.2,
  CNY: 0.51,
  HKD: 0.47,
  SGD: 2.7,
  INR: 0.044,
  KRW: 0.0027,
  THB: 0.1,
  VND: 0.00015,
  PHP: 0.065,
  IDR: 0.00023,
  MYR: 0.79,
  TRY: 0.11,
  RUB: 0.038,
  PLN: 0.93,
  CZK: 0.16,
  HUF: 0.0098,
  RON: 0.8,
  BGN: 2.05,
  SEK: 0.34,
  NOK: 0.33,
  DKK: 0.54,
  ISK: 0.027,
  UAH: 0.09,
  ZAR: 0.2,
  EGP: 0.075,
  JOD: 5.2,
  AED: 1.0,
  SAR: 0.99,
  QAR: 1.02,
  KWD: 12.0,
  BHD: 9.8,
  OMR: 9.6,
  LBP: 0.00004,
  BRL: 0.62,
  MXN: 0.19,
  ARS: 0.004,
  CLP: 0.0038,
  COP: 0.00085,
  PEN: 0.98,
  PKR: 0.013,
  BDT: 0.031,
  LKR: 0.012,
  NPR: 0.027,
  GEL: 1.35,
  AZN: 2.18,
  KZT: 0.0075,
  MAD: 0.37,
  TND: 1.15,
};

export interface ExchangeRateResult {
  rate: number; // 1 unit of the currency, in ILS
  isLive: boolean;
}

// Free, keyless, daily-updated rates (no signup/API key needed) — see
// https://github.com/fawazahmed0/exchange-api. Falls back to a fixed approximate rate if the
// request fails, so entering a foreign-currency expense never blocks on network access.
export async function getExchangeRateToILS(currency: Currency): Promise<ExchangeRateResult> {
  const code = currency.toLowerCase();
  try {
    const response = await fetch(
      `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/${code}.json`
    );
    if (!response.ok) throw new Error('bad response');
    const data = await response.json();
    const rate = data?.[code]?.ils;
    if (typeof rate !== 'number' || !isFinite(rate) || rate <= 0) throw new Error('missing rate');
    return { rate, isLive: true };
  } catch {
    return { rate: FALLBACK_RATES_TO_ILS[currency], isLive: false };
  }
}

export function formatForeignAmount(amount: number, currency: Currency): string {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
  return `${symbol}${amount.toLocaleString('he-IL', { maximumFractionDigits: 2 })}`;
}
