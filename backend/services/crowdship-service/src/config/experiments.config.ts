/**
 * Experiments Configuration
 * Non-Regulated Experiments Only
 *
 * HARD RULES:
 * - Experiments MUST be isolated
 * - Feature flags OFF by default
 * - No shared state mutation
 * - Max 5% exposure by default, 20% hard cap
 */

import { ExperimentConfig, ExperimentType, BlockedExperimentType } from '../types/experiments.types';

// ===========================================
// Safety Constants
// ===========================================

export const DEFAULT_EXPOSURE_PERCENT = 5;
export const MAX_EXPOSURE_PERCENT = 20;
export const ERROR_THRESHOLD_DEFAULT = 5; // 5% error rate triggers auto-disable
export const MAX_EXPERIMENT_DURATION_DAYS = 30;

// ===========================================
// Blocked Experiment Types
// ===========================================

export const BLOCKED_EXPERIMENT_TYPES: BlockedExperimentType[] = [
  'PAYMENT_FLOW',
  'ESCROW_LOGIC',
  'TRUST_SCORING',
  'RISK_ASSESSMENT',
  'RANKING_ALGORITHM',
  'ENFORCEMENT_RULE',
];

// ===========================================
// Allowed Experiment Types
// ===========================================

export const ALLOWED_EXPERIMENT_TYPES: ExperimentType[] = [
  'UI_COPY_VARIANT',
  'LAYOUT_TOGGLE',
  'INFO_PANEL',
  'EDUCATION_FLOW',
];

// ===========================================
// Sample Experiments (All Disabled by Default)
// ===========================================

export const EXPERIMENTS: ExperimentConfig[] = [
  {
    id: 'exp_welcome_copy_v1',
    name: 'Welcome Message Copy Test',
    description: 'Test different welcome message copy on homepage',
    type: 'UI_COPY_VARIANT',
    enabled: false, // OFF by default
    killSwitch: false,
    markets: ['MARKET_0'],
    corridors: ['US_EG', 'US_AE'],
    exposurePercent: 5,
    maxExposurePercent: 10,
    cohortSeed: 'welcome_copy_2024',
    excludeCohorts: [],
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-02-01T00:00:00Z',
    autoDisableOnExpiry: true,
    variants: [
      {
        id: 'control',
        name: 'Control',
        weight: 50,
        isControl: true,
        config: { message: 'Welcome to MNBARA' },
      },
      {
        id: 'variant_a',
        name: 'Variant A',
        weight: 50,
        isControl: false,
        config: { message: 'Start your cross-border shopping journey' },
      },
    ],
    controlVariantId: 'control',
    errorThreshold: 5,
  },
  {
    id: 'exp_trust_education_v1',
    name: 'Trust Education Panel',
    description: 'Show optional trust education panel to new users',
    type: 'EDUCATION_FLOW',
    enabled: false,
    killSwitch: false,
    markets: ['MARKET_0', 'MARKET_1'],
    corridors: [],
    exposurePercent: 5,
    maxExposurePercent: 15,
    cohortSeed: 'trust_edu_2024',
    excludeCohorts: [],
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-03-01T00:00:00Z',
    autoDisableOnExpiry: true,
    variants: [
      {
        id: 'control',
        name: 'No Education Panel',
        weight: 50,
        isControl: true,
        config: { showPanel: false },
      },
      {
        id: 'variant_panel',
        name: 'Show Education Panel',
        weight: 50,
        isControl: false,
        config: { showPanel: true, panelType: 'trust_basics' },
      },
    ],
    controlVariantId: 'control',
    errorThreshold: 5,
  },
  {
    id: 'exp_corridor_info_v1',
    name: 'Corridor Info Panel Layout',
    description: 'Test different layouts for corridor information panel',
    type: 'LAYOUT_TOGGLE',
    enabled: false,
    killSwitch: false,
    markets: ['MARKET_0'],
    corridors: ['US_EG'],
    exposurePercent: 5,
    maxExposurePercent: 10,
    cohortSeed: 'corridor_layout_2024',
    excludeCohorts: [],
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-02-15T00:00:00Z',
    autoDisableOnExpiry: true,
    variants: [
      {
        id: 'control',
        name: 'Standard Layout',
        weight: 50,
        isControl: true,
        config: { layout: 'standard' },
      },
      {
        id: 'variant_compact',
        name: 'Compact Layout',
        weight: 50,
        isControl: false,
        config: { layout: 'compact' },
      },
    ],
    controlVariantId: 'control',
    errorThreshold: 5,
  },
  {
    id: 'exp_fee_explanation_v1',
    name: 'Fee Explanation Info Panel',
    description: 'Show read-only fee explanation panel',
    type: 'INFO_PANEL',
    enabled: false,
    killSwitch: false,
    markets: ['MARKET_0', 'MARKET_1'],
    corridors: [],
    exposurePercent: 5,
    maxExposurePercent: 20,
    cohortSeed: 'fee_info_2024',
    excludeCohorts: [],
    startDate: '2024-01-01T00:00:00Z',
    endDate: '2024-04-01T00:00:00Z',
    autoDisableOnExpiry: true,
    variants: [
      {
        id: 'control',
        name: 'No Info Panel',
        weight: 50,
        isControl: true,
        config: { showInfoPanel: false },
      },
      {
        id: 'variant_detailed',
        name: 'Detailed Fee Breakdown',
        weight: 50,
        isControl: false,
        config: { showInfoPanel: true, detailLevel: 'detailed' },
      },
    ],
    controlVariantId: 'control',
    errorThreshold: 5,
  },
];

// ===========================================
// Helper Functions
// ===========================================

export function getExperimentById(id: string): ExperimentConfig | null {
  return EXPERIMENTS.find((e) => e.id === id) || null;
}

export function getActiveExperiments(): ExperimentConfig[] {
  const now = new Date();
  return EXPERIMENTS.filter((e) => {
    if (!e.enabled || e.killSwitch) return false;
    if (e.autoDisabledReason) return false;
    const start = new Date(e.startDate);
    const end = new Date(e.endDate);
    return now >= start && now <= end;
  });
}

export function getExperimentsForMarket(market: string): ExperimentConfig[] {
  return getActiveExperiments().filter(
    (e) => e.markets.length === 0 || e.markets.includes(market)
  );
}

export function getExperimentsForCorridor(corridor: string): ExperimentConfig[] {
  return getActiveExperiments().filter(
    (e) => e.corridors.length === 0 || e.corridors.includes(corridor)
  );
}

export function isExperimentTypeAllowed(type: string): boolean {
  return ALLOWED_EXPERIMENT_TYPES.includes(type as ExperimentType);
}

export function isExperimentTypeBlocked(type: string): boolean {
  return BLOCKED_EXPERIMENT_TYPES.includes(type as BlockedExperimentType);
}

export function validateExposurePercent(percent: number): number {
  return Math.min(Math.max(0, percent), MAX_EXPOSURE_PERCENT);
}
