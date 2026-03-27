/**
 * Deterministic trust rules — no automation. The engine merely advises humans.
 * It never auto-matches, auto-approves, or ranks.
 */

export type CorridorRisk = 'low' | 'medium' | 'high';

export type TrustInput = {
  declaredValueUSD: number;
  corridorRisk: CorridorRisk;
  travelerTrustScore?: number; // 0 → 1 scale
};

export type TrustDecision = {
  needsManualConfirmation: boolean;
  warnings: string[];
  blocks: string[];
  advisory: string;
};

const VALUE_CONFIRM_THRESHOLD = 250;

export function evaluateTrustRules(input: TrustInput): TrustDecision {
  const warnings: string[] = [];
  const blocks: string[] = [];

  if (input.declaredValueUSD > VALUE_CONFIRM_THRESHOLD) {
    warnings.push('High-value request — manual confirmation required before traveler approval.');
  }

  if (input.corridorRisk === 'high') {
    warnings.push('Corridor flagged as high risk. Elevate to trust ops before proceeding.');
  }

  if (!input.travelerTrustScore || input.travelerTrustScore < 0.5) {
    blocks.push('Traveler lacks sufficient trust signal. Collect more verification data first.');
  }

  return {
    needsManualConfirmation: true,
    warnings,
    blocks,
    advisory: 'System may advise, but a human must confirm every action. No auto decisions.',
  };
}
