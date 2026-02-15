/**
 * Market 1 Product Configuration
 * Sprint 4: Market 1 Product & Ops Enablement
 *
 * Market 1 = EU → MENA corridors (UK, DE, FR → EG, AE, SA)
 * Same trust-first principles as Market 0
 *
 * CONSTRAINTS:
 * - No new user powers
 * - No automation
 * - No payments
 * - Advisory only
 */

import { CorridorConfig, TrustRequirement } from './market-corridors';

// ===========================================
// Market 1 Intent Configuration
// ===========================================

export interface IntentConfig {
  intentType: string;
  allowed: boolean;
  requiresConfirmation: boolean;
  trustRequirement: TrustRequirement;
  blockedReason?: string;
}

/**
 * Market 1 Allowed Intents
 * Same as Market 0 - no new user powers
 */
export const MARKET_1_INTENTS: IntentConfig[] = [
  // ALLOWED INTENTS
  {
    intentType: 'BUY_FROM_ABROAD',
    allowed: true,
    requiresConfirmation: true,
    trustRequirement: 'STANDARD',
  },
  {
    intentType: 'TRAVEL_MATCH',
    allowed: true,
    requiresConfirmation: true,
    trustRequirement: 'TRUSTED',
  },
  {
    intentType: 'PRICE_VERIFY',
    allowed: true,
    requiresConfirmation: false,
    trustRequirement: 'ANY',
  },
  {
    intentType: 'BROWSE',
    allowed: true,
    requiresConfirmation: false,
    trustRequirement: 'ANY',
  },
  {
    intentType: 'COMPARE',
    allowed: true,
    requiresConfirmation: false,
    trustRequirement: 'ANY',
  },

  // BLOCKED INTENTS - No automation, no new powers
  {
    intentType: 'AUTO_MATCH',
    allowed: false,
    requiresConfirmation: false,
    trustRequirement: 'ANY',
    blockedReason: 'Automatic matching is not available. Human confirmation required.',
  },
  {
    intentType: 'AUTO_PURCHASE',
    allowed: false,
    requiresConfirmation: false,
    trustRequirement: 'ANY',
    blockedReason: 'Automatic purchasing is not available. Human confirmation required.',
  },
  {
    intentType: 'BULK_ORDER',
    allowed: false,
    requiresConfirmation: false,
    trustRequirement: 'ANY',
    blockedReason: 'Bulk orders are not available in Market 1.',
  },
  {
    intentType: 'RESALE',
    allowed: false,
    requiresConfirmation: false,
    trustRequirement: 'ANY',
    blockedReason: 'Resale intent is not supported.',
  },
];

// ===========================================
// Market 1 Blocked Flows
// ===========================================

export interface BlockedFlow {
  flowId: string;
  flowName: string;
  reason: string;
  userMessage: string;
}

export const MARKET_1_BLOCKED_FLOWS: BlockedFlow[] = [
  {
    flowId: 'PAYMENT_EXECUTION',
    flowName: 'Payment Execution',
    reason: 'No payments in Market 1',
    userMessage: 'Payment processing is not yet available for this corridor.',
  },
  {
    flowId: 'ESCROW_EXECUTION',
    flowName: 'Escrow Execution',
    reason: 'No escrow execution in Market 1',
    userMessage: 'Escrow services are recommended but not yet executable.',
  },
  {
    flowId: 'AUTO_MATCHING',
    flowName: 'Automatic Matching',
    reason: 'No automation in Market 1',
    userMessage: 'Please manually review and confirm traveler matches.',
  },
  {
    flowId: 'BACKGROUND_ACTIONS',
    flowName: 'Background Actions',
    reason: 'No background actions allowed',
    userMessage: 'All actions require your explicit confirmation.',
  },
  {
    flowId: 'RANKING_SUPPRESSION',
    flowName: 'Ranking Suppression',
    reason: 'No hidden ranking changes',
    userMessage: 'All recommendations are transparent with explanations.',
  },
];

// ===========================================
// Market 1 Corridor Configuration
// ===========================================

export const MARKET_1_CORRIDORS: CorridorConfig[] = [
  // UK → Egypt
  {
    id: 'UK_EG',
    name: 'United Kingdom → Egypt',
    origin: 'UK',
    destinations: ['EG'],
    enabled: false, // Disabled until launch
    riskMultipliers: {
      customs: 1.25,
      valueBands: [
        { minValue: 0, maxValue: 100, multiplier: 1.0, label: 'Low Value' },
        { minValue: 100, maxValue: 200, multiplier: 1.1, label: 'Standard' },
        { minValue: 200, maxValue: 500, multiplier: 1.25, label: 'Elevated' },
        { minValue: 500, maxValue: 2000, multiplier: 1.45, label: 'High Value' },
        { minValue: 2000, maxValue: Infinity, multiplier: 1.9, label: 'Very High' },
      ],
      deliveryWindow: [
        { minDays: 1, maxDays: 5, multiplier: 1.25, label: 'Express' },
        { minDays: 5, maxDays: 12, multiplier: 1.0, label: 'Standard' },
        { minDays: 12, maxDays: 25, multiplier: 0.9, label: 'Economy' },
      ],
    },
    trustRequirements: {
      highValueThreshold: 200,
      minBuyerTrust: 'TRUSTED',
      minTravelerTrust: 'TRUSTED',
    },
    escrowPolicy: 'ALWAYS_RECOMMENDED',
    restrictions: ['electronics_batteries', 'liquids_over_100ml', 'restricted_medications'],
  },

  // UK → UAE
  {
    id: 'UK_AE',
    name: 'United Kingdom → UAE',
    origin: 'UK',
    destinations: ['AE'],
    enabled: false,
    riskMultipliers: {
      customs: 1.05,
      valueBands: [
        { minValue: 0, maxValue: 100, multiplier: 1.0, label: 'Low Value' },
        { minValue: 100, maxValue: 200, multiplier: 1.05, label: 'Standard' },
        { minValue: 200, maxValue: 500, multiplier: 1.15, label: 'Elevated' },
        { minValue: 500, maxValue: 2000, multiplier: 1.35, label: 'High Value' },
        { minValue: 2000, maxValue: Infinity, multiplier: 1.7, label: 'Very High' },
      ],
      deliveryWindow: [
        { minDays: 1, maxDays: 4, multiplier: 1.2, label: 'Express' },
        { minDays: 4, maxDays: 8, multiplier: 1.0, label: 'Standard' },
        { minDays: 8, maxDays: 18, multiplier: 0.9, label: 'Economy' },
      ],
    },
    trustRequirements: {
      highValueThreshold: 200,
      minBuyerTrust: 'TRUSTED',
      minTravelerTrust: 'TRUSTED',
    },
    escrowPolicy: 'ALWAYS_RECOMMENDED',
    restrictions: ['alcohol', 'pork_products', 'restricted_medications'],
  },

  // DE → Egypt
  {
    id: 'DE_EG',
    name: 'Germany → Egypt',
    origin: 'DE',
    destinations: ['EG'],
    enabled: false,
    riskMultipliers: {
      customs: 1.3,
      valueBands: [
        { minValue: 0, maxValue: 100, multiplier: 1.0, label: 'Low Value' },
        { minValue: 100, maxValue: 200, multiplier: 1.1, label: 'Standard' },
        { minValue: 200, maxValue: 500, multiplier: 1.3, label: 'Elevated' },
        { minValue: 500, maxValue: 2000, multiplier: 1.5, label: 'High Value' },
        { minValue: 2000, maxValue: Infinity, multiplier: 2.0, label: 'Very High' },
      ],
      deliveryWindow: [
        { minDays: 1, maxDays: 6, multiplier: 1.3, label: 'Express' },
        { minDays: 6, maxDays: 14, multiplier: 1.0, label: 'Standard' },
        { minDays: 14, maxDays: 28, multiplier: 0.85, label: 'Economy' },
      ],
    },
    trustRequirements: {
      highValueThreshold: 200,
      minBuyerTrust: 'TRUSTED',
      minTravelerTrust: 'TRUSTED',
    },
    escrowPolicy: 'ALWAYS_RECOMMENDED',
    restrictions: ['electronics_batteries', 'liquids_over_100ml', 'restricted_medications'],
  },

  // FR → UAE
  {
    id: 'FR_AE',
    name: 'France → UAE',
    origin: 'FR',
    destinations: ['AE'],
    enabled: false,
    riskMultipliers: {
      customs: 1.1,
      valueBands: [
        { minValue: 0, maxValue: 100, multiplier: 1.0, label: 'Low Value' },
        { minValue: 100, maxValue: 200, multiplier: 1.05, label: 'Standard' },
        { minValue: 200, maxValue: 500, multiplier: 1.2, label: 'Elevated' },
        { minValue: 500, maxValue: 2000, multiplier: 1.4, label: 'High Value' },
        { minValue: 2000, maxValue: Infinity, multiplier: 1.8, label: 'Very High' },
      ],
      deliveryWindow: [
        { minDays: 1, maxDays: 5, multiplier: 1.2, label: 'Express' },
        { minDays: 5, maxDays: 10, multiplier: 1.0, label: 'Standard' },
        { minDays: 10, maxDays: 21, multiplier: 0.9, label: 'Economy' },
      ],
    },
    trustRequirements: {
      highValueThreshold: 200,
      minBuyerTrust: 'TRUSTED',
      minTravelerTrust: 'TRUSTED',
    },
    escrowPolicy: 'ALWAYS_RECOMMENDED',
    restrictions: ['alcohol', 'pork_products', 'restricted_medications'],
  },
];

// ===========================================
// Market 1 Abort Conditions
// ===========================================

export interface AbortCondition {
  id: string;
  signal: string;
  threshold: number;
  unit: string;
  action: 'ALERT' | 'THROTTLE' | 'SHUTDOWN';
  description: string;
}

export const MARKET_1_ABORT_CONDITIONS: AbortCondition[] = [
  {
    id: 'TRUST_REJECTION_RATE',
    signal: 'Trust gating rejection rate',
    threshold: 50,
    unit: '%',
    action: 'SHUTDOWN',
    description: 'If >50% of requests fail trust gating, shutdown Market 1',
  },
  {
    id: 'ERROR_RATE',
    signal: 'API error rate',
    threshold: 10,
    unit: '%',
    action: 'SHUTDOWN',
    description: 'If >10% of API calls error, shutdown Market 1',
  },
  {
    id: 'CORRIDOR_CAPACITY',
    signal: 'Any corridor at capacity',
    threshold: 100,
    unit: '%',
    action: 'THROTTLE',
    description: 'If any corridor hits 100% capacity, throttle new requests',
  },
  {
    id: 'ABUSE_DETECTION',
    signal: 'Abuse pattern detected',
    threshold: 5,
    unit: 'incidents/hour',
    action: 'ALERT',
    description: 'If >5 abuse incidents per hour, alert ops team',
  },
  {
    id: 'FUNNEL_DROP',
    signal: 'Funnel conversion drop',
    threshold: 30,
    unit: '% below baseline',
    action: 'ALERT',
    description: 'If conversion drops >30% below baseline, alert ops team',
  },
  {
    id: 'LATENCY_SPIKE',
    signal: 'P95 latency',
    threshold: 5000,
    unit: 'ms',
    action: 'ALERT',
    description: 'If P95 latency exceeds 5s, alert ops team',
  },
  {
    id: 'EMERGENCY_KILL',
    signal: 'Manual kill switch activated',
    threshold: 1,
    unit: 'trigger',
    action: 'SHUTDOWN',
    description: 'Immediate shutdown on manual kill switch',
  },
];

// ===========================================
// Helper Functions
// ===========================================

export function isIntentAllowed(intentType: string): boolean {
  const config = MARKET_1_INTENTS.find((i) => i.intentType === intentType);
  return config?.allowed ?? false;
}

export function getIntentConfig(intentType: string): IntentConfig | null {
  return MARKET_1_INTENTS.find((i) => i.intentType === intentType) || null;
}

export function isFlowBlocked(flowId: string): boolean {
  return MARKET_1_BLOCKED_FLOWS.some((f) => f.flowId === flowId);
}

export function getBlockedFlowMessage(flowId: string): string | null {
  const flow = MARKET_1_BLOCKED_FLOWS.find((f) => f.flowId === flowId);
  return flow?.userMessage || null;
}

export function getMarket1Corridor(origin: string, destination: string): CorridorConfig | null {
  return (
    MARKET_1_CORRIDORS.find((c) => c.origin === origin && c.destinations.includes(destination)) ||
    null
  );
}

export function checkAbortCondition(
  conditionId: string,
  currentValue: number
): { triggered: boolean; action: string } | null {
  const condition = MARKET_1_ABORT_CONDITIONS.find((c) => c.id === conditionId);
  if (!condition) return null;

  return {
    triggered: currentValue >= condition.threshold,
    action: condition.action,
  };
}
