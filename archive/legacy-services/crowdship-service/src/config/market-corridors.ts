/**
 * Market Corridor Configuration
 * Sprint 2: US → MENA corridor activation
 * 
 * Config-only (no hardcoded logic)
 * Risk multipliers per corridor
 */

export interface CorridorConfig {
  id: string;
  name: string;
  origin: string;
  destinations: string[];
  enabled: boolean;
  riskMultipliers: {
    customs: number;      // 1.0 = baseline
    valueBands: ValueBandMultiplier[];
    deliveryWindow: DeliveryWindowMultiplier[];
  };
  trustRequirements: {
    highValueThreshold: number;  // USD
    minBuyerTrust: TrustRequirement;
    minTravelerTrust: TrustRequirement;
  };
  escrowPolicy: 'ALWAYS_RECOMMENDED' | 'HIGH_VALUE_ONLY' | 'OPTIONAL';
  restrictions: string[];
}

export interface ValueBandMultiplier {
  minValue: number;
  maxValue: number;
  multiplier: number;
  label: string;
}

export interface DeliveryWindowMultiplier {
  minDays: number;
  maxDays: number;
  multiplier: number;
  label: string;
}

export type TrustRequirement = 'VERIFIED' | 'TRUSTED' | 'STANDARD' | 'NEW' | 'ANY';

// US → MENA Corridor Configuration
export const MARKET_CORRIDORS: CorridorConfig[] = [
  {
    id: 'US_EG',
    name: 'United States → Egypt',
    origin: 'US',
    destinations: ['EG'],
    enabled: true,
    riskMultipliers: {
      customs: 1.3,  // Higher customs complexity
      valueBands: [
        { minValue: 0, maxValue: 100, multiplier: 1.0, label: 'Low Value' },
        { minValue: 100, maxValue: 200, multiplier: 1.1, label: 'Standard' },
        { minValue: 200, maxValue: 500, multiplier: 1.3, label: 'Elevated' },
        { minValue: 500, maxValue: 2000, multiplier: 1.5, label: 'High Value' },
        { minValue: 2000, maxValue: Infinity, multiplier: 2.0, label: 'Very High' },
      ],
      deliveryWindow: [
        { minDays: 1, maxDays: 7, multiplier: 1.3, label: 'Express' },
        { minDays: 7, maxDays: 14, multiplier: 1.0, label: 'Standard' },
        { minDays: 14, maxDays: 30, multiplier: 0.9, label: 'Economy' },
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

  {
    id: 'US_AE',
    name: 'United States → UAE',
    origin: 'US',
    destinations: ['AE'],
    enabled: true,
    riskMultipliers: {
      customs: 1.1,  // Lower customs complexity
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
  {
    id: 'US_SA',
    name: 'United States → Saudi Arabia',
    origin: 'US',
    destinations: ['SA'],
    enabled: true,
    riskMultipliers: {
      customs: 1.4,  // Higher customs complexity
      valueBands: [
        { minValue: 0, maxValue: 100, multiplier: 1.0, label: 'Low Value' },
        { minValue: 100, maxValue: 200, multiplier: 1.15, label: 'Standard' },
        { minValue: 200, maxValue: 500, multiplier: 1.35, label: 'Elevated' },
        { minValue: 500, maxValue: 2000, multiplier: 1.6, label: 'High Value' },
        { minValue: 2000, maxValue: Infinity, multiplier: 2.2, label: 'Very High' },
      ],
      deliveryWindow: [
        { minDays: 1, maxDays: 7, multiplier: 1.3, label: 'Express' },
        { minDays: 7, maxDays: 14, multiplier: 1.0, label: 'Standard' },
        { minDays: 14, maxDays: 28, multiplier: 0.85, label: 'Economy' },
      ],
    },
    trustRequirements: {
      highValueThreshold: 200,
      minBuyerTrust: 'TRUSTED',
      minTravelerTrust: 'TRUSTED',
    },
    escrowPolicy: 'ALWAYS_RECOMMENDED',
    restrictions: ['alcohol', 'pork_products', 'religious_items', 'restricted_medications'],
  },
];

/**
 * Get corridor config by origin and destination
 */
export function getCorridorConfig(origin: string, destination: string): CorridorConfig | null {
  return MARKET_CORRIDORS.find(c => c.origin === origin && c.destinations.includes(destination) && c.enabled) || null;
}

/**
 * Check if corridor is supported
 */
export function isCorridorSupported(origin: string, destination: string): boolean {
  return getCorridorConfig(origin, destination) !== null;
}

/**
 * Get risk multiplier for value band
 */
export function getValueBandMultiplier(corridor: CorridorConfig, valueUSD: number): ValueBandMultiplier {
  return corridor.riskMultipliers.valueBands.find(b => valueUSD >= b.minValue && valueUSD < b.maxValue) 
    || corridor.riskMultipliers.valueBands[corridor.riskMultipliers.valueBands.length - 1];
}

/**
 * Get risk multiplier for delivery window
 */
export function getDeliveryWindowMultiplier(corridor: CorridorConfig, days: number): DeliveryWindowMultiplier {
  return corridor.riskMultipliers.deliveryWindow.find(d => days >= d.minDays && days <= d.maxDays)
    || corridor.riskMultipliers.deliveryWindow[corridor.riskMultipliers.deliveryWindow.length - 1];
}
