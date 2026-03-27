export const FEE_CONFIG_VERSION = '2025-09-01';

export type FeeConfig = {
  traveler_fee_percent: number;
  traveler_fee_min_usd: number;
  platform_fee_percent: number;
  platform_fee_min_usd: number;
};

export const PSP_PROVIDER = 'AkhbarPay' as const;
export const WALLET_STATUS = 'psp_custody' as const;
export const ESCROW_STATUS = 'psp_managed' as const;
export const SUPPORTED_PAYMENT_METHODS = [
  'card_visa',
  'card_mastercard',
  'wallet_vodafone_cash',
  'wallet_orange',
  'wallet_etisalat',
  'instant_bank_transfer',
  'fawry',
] as const;

export const feeConfig: FeeConfig = {
  traveler_fee_percent: 0.12,
  traveler_fee_min_usd: 18,
  platform_fee_percent: 0.05,
  platform_fee_min_usd: 5,
};

export function applyFeeFloor(value: number, floor: number) {
  return Math.max(value, floor);
}
