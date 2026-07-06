import { Currency } from './types';

export interface CurrencyOption {
  code: Currency;
  label: string;
  symbol: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'דולר', symbol: '$' },
  { code: 'EUR', label: 'יורו', symbol: '€' },
  { code: 'THB', label: 'באט', symbol: '฿' },
  { code: 'VND', label: 'דונג', symbol: '₫' },
];

// Approximate rates to ILS, used only when the live-rate fetch below fails (e.g. no network) —
// good enough to keep the app usable offline, not meant to stay accurate over time.
const FALLBACK_RATES_TO_ILS: Record<Currency, number> = {
  USD: 3.7,
  EUR: 4.0,
  THB: 0.1,
  VND: 0.00015,
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
