/**
 * FX advisory service keeps exchange rate estimations read-only.
 * Money movement is intentionally disabled until Mnbarh secures regulatory clearance.
 */

export type FxQuote = {
  base_currency: 'USD';
  target_currency: string;
  rate: number;
  disclaimer: string;
};

const FX_TABLE: Record<string, number> = {
  AED: 3.6725,
  SAR: 3.75,
  EUR: 0.93,
  GBP: 0.8,
};

export function getFxQuote(target_currency: string): FxQuote {
  const normalized = target_currency.toUpperCase();
  const rate = FX_TABLE[normalized] ?? 1;

  return {
    base_currency: 'USD',
    target_currency: normalized,
    rate,
    disclaimer: 'FX figures are informational only. Funds are NOT collected yet.',
  };
}
