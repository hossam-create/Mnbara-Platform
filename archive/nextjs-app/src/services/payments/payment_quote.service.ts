/**
 * Payment quote service is advisory-only. It never triggers PSP flows, wallet balances,
 * or escrow releases. See README "Payments Advisory Mode" for rationale.
 */

import { applyFeeFloor, feeConfig } from './fee_config';
import { getFxQuote } from './fx_advisory.service';

export type PaymentQuoteInput = {
  product_price: number;
  traveler_currency?: string;
};

export type PaymentQuote = {
  product_price: number;
  traveler_fee: number;
  platform_fee: number;
  estimated_fx: {
    base_currency: string;
    target_currency: string;
    rate: number;
    disclaimer: string;
  };
  total_estimated: number;
  advisory_notice: string;
  PSP_PROVIDER: null;
  WALLET_STATUS: 'disabled';
  ESCROW_STATUS: 'advisory';
};

export function getPaymentQuote(params: PaymentQuoteInput): PaymentQuote {
  const productPrice = Math.max(params.product_price, 0);

  const travelerFee = applyFeeFloor(
    productPrice * feeConfig.traveler_fee_percent,
    feeConfig.traveler_fee_min_usd,
  );

  const platformFee = applyFeeFloor(
    productPrice * feeConfig.platform_fee_percent,
    feeConfig.platform_fee_min_usd,
  );

  const fx = getFxQuote(params.traveler_currency ?? 'USD');

  return {
    product_price: productPrice,
    traveler_fee: Number(travelerFee.toFixed(2)),
    platform_fee: Number(platformFee.toFixed(2)),
    estimated_fx: fx,
    total_estimated: Number((productPrice + travelerFee + platformFee).toFixed(2)),
    advisory_notice: 'Funds are NOT collected yet. Payment execution will be enabled later.',
    PSP_PROVIDER: null,
    WALLET_STATUS: 'disabled',
    ESCROW_STATUS: 'advisory',
  };
}
