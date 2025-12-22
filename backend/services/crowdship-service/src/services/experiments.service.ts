/**
 * Experiments Service
 * Non-Regulated Growth Experiments Only
 *
 * HARD RULES:
 * - Experiments MUST be isolated
 * - Feature flags OFF by default
 * - No shared state mutation
 * - No experiment can affect: payments, escrow, trust, risk, ranking, or enforcement
 * - No long-term storage of experiment decisions
 * - No auto-enrollment without visibility
 */

import { createHash } from 'crypto';
import { getFeatureFlags } from '../config/feature-flags';
import {
  ExperimentConfig,
  ExperimentAssignment,
  ExperimentExposure,
  ExperimentMetrics,
  ExperimentHealth,
  ExperimentAuditLog,
  ExperimentDisclaimer,
  ActiveExperimentsResponse,
  ExposureContext,
} from '../types/experiments.types';
import {
  EXPERIMENTS,
  getActiveExperiments,
  getExperimentsForMarket,
  getExperimentsForCorridor,
  getExperimentById,
  DEFAULT_EXPOSURE_PERCENT,
  MAX_EXPOSURE_PERCENT,
  ERROR_THRESHOLD_DEFAULT,
} from '../config/experiments.config';

// ===========================================
// In-Memory Stores (No Long-Term Storage)
// ===========================================

// Exposure counts per experiment (for metrics only, not decisions)
const exposureCounts: Map<string, Map<string, number>> = new Map();

// Error counts per experiment (for auto-disable)
const errorCounts: Map<string, number> = new Map();

// Audit log (in-memory, capped)
const auditLog: ExperimentAuditLog[] = [];
const MAX_AUDIT_LOG = 1000;

// ===========================================
// Disclaimer Generator
// ===========================================

function generateDisclaimer(): ExperimentDisclaimer {
  return {
    type: 'EXPERIMENT',
    text: 'This experiment is isolated and does not affect payments, escrow, trust, risk, ranking, or enforcement. No side effects.',
    noSideEffects: true,
    isolated: true,
    nonRegulated: true,
  };
}

// ===========================================
// Experiments Service
// ===========================================

export class ExperimentsService {
  /**
   * Get active experiments for a user
   * READ-ONLY - No side effects
   */
  getActiveExperiments(
    userId: string,
    market: string,
    corridor?: string
  ): ActiveExperimentsResponse {
    const flags = getFeatureFlags();

    if (flags.EMERGENCY_DISABLE_ALL || !flags.EXPERIMENTS_ENABLED) {
      return {
        experiments: [],
        userAssignments: [],
        timestamp: new Date().toISOString(),
        disclaimer: generateDisclaimer(),
      };
    }

    // Get experiments for market/corridor
    let experiments = corridor
      ? getExperimentsForCorridor(corridor)
      : getExperimentsForMarket(market);

    // Filter by kill switch
    experiments = experiments.filter((e) => !e.killSwitch);

    // Get user assignments (deterministic, not stored)
    const assignments = experiments.map((exp) => this.assignUserToExperiment(userId, exp));

    return {
      experiments,
      userAssignments: assignments,
      timestamp: new Date().toISOString(),
      disclaimer: generateDisclaimer(),
    };
  }

  /**
   * Assign user to experiment variant
   * DETERMINISTIC - Same user always gets same variant
   * NO STORAGE - Assignment computed on-the-fly
   */
  assignUserToExperiment(userId: string, experiment: ExperimentConfig): ExperimentAssignment {
    // Check if user is in exposure cohort
    const isExposed = this.isUserInExposureCohort(userId, experiment);

    if (!isExposed) {
      // User not in experiment, assign to control
      return {
        experimentId: experiment.id,
        variantId: experiment.controlVariantId,
        userId,
        cohort: 'control',
        assignedAt: new Date().toISOString(),
        expiresAt: experiment.endDate,
        isControl: true,
      };
    }

    // Deterministic variant assignment based on user ID and cohort seed
    const variantId = this.determineVariant(userId, experiment);
    const variant = experiment.variants.find((v) => v.id === variantId);

    return {
      experimentId: experiment.id,
      variantId,
      userId,
      cohort: `exp_${experiment.id}`,
      assignedAt: new Date().toISOString(),
      expiresAt: experiment.endDate,
      isControl: variant?.isControl ?? true,
    };
  }

  /**
   * Check if user is in exposure cohort
   * DETERMINISTIC - Based on hash of userId + cohortSeed
   */
  isUserInExposureCohort(userId: string, experiment: ExperimentConfig): boolean {
    const hash = this.hashString(`${userId}:${experiment.cohortSeed}:exposure`);
    const hashPercent = (hash % 10000) / 100; // 0-100 with 2 decimal precision

    return hashPercent < experiment.exposurePercent;
  }

  /**
   * Determine variant for user
   * DETERMINISTIC - Based on hash of userId + cohortSeed
   */
  determineVariant(userId: string, experiment: ExperimentConfig): string {
    const hash = this.hashString(`${userId}:${experiment.cohortSeed}:variant`);
    const hashPercent = (hash % 10000) / 100;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (hashPercent < cumulative) {
        return variant.id;
      }
    }

    // Fallback to control
    return experiment.controlVariantId;
  }

  /**
   * Record experiment exposure
   * IN-MEMORY ONLY - No long-term storage
   */
  recordExposure(
    experimentId: string,
    variantId: string,
    userId: string,
    market: string,
    context: ExposureContext
  ): void {
    const flags = getFeatureFlags();
    if (flags.EMERGENCY_DISABLE_ALL || !flags.EXPERIMENTS_ENABLED) return;

    // Update exposure counts (in-memory only)
    if (!exposureCounts.has(experimentId)) {
      exposureCounts.set(experimentId, new Map());
    }
    const variantCounts = exposureCounts.get(experimentId)!;
    variantCounts.set(variantId, (variantCounts.get(variantId) || 0) + 1);

    // Audit log
    this.logAudit({
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      experimentId,
      action: 'EXPOSURE',
      userId,
      variantId,
      timestamp: new Date().toISOString(),
      metadata: { market, context },
    });
  }

  /**
   * Record experiment error
   * Used for auto-disable on error spike
   */
  recordError(experimentId: string): void {
    const count = (errorCounts.get(experimentId) || 0) + 1;
    errorCounts.set(experimentId, count);

    // Check if should auto-disable
    const experiment = getExperimentById(experimentId);
    if (experiment) {
      const totalExposures = this.getTotalExposures(experimentId);
      if (totalExposures > 100) {
        const errorRate = (count / totalExposures) * 100;
        if (errorRate > (experiment.errorThreshold || ERROR_THRESHOLD_DEFAULT)) {
          this.autoDisableExperiment(experimentId, `Error rate ${errorRate.toFixed(1)}% exceeded threshold`);
        }
      }
    }
  }

  /**
   * Get experiment metrics (aggregated only)
   * READ-ONLY
   */
  getExperimentMetrics(experimentId: string, period: '1h' | '24h' | '7d' = '24h'): ExperimentMetrics {
    const experiment = getExperimentById(experimentId);
    const variantCounts = exposureCounts.get(experimentId) || new Map();
    const totalExposures = this.getTotalExposures(experimentId);
    const errors = errorCounts.get(experimentId) || 0;

    const variants = experiment?.variants.map((v) => ({
      variantId: v.id,
      exposures: variantCounts.get(v.id) || 0,
      exposurePercent: totalExposures > 0 ? ((variantCounts.get(v.id) || 0) / totalExposures) * 100 : 0,
    })) || [];

    return {
      experimentId,
      timestamp: new Date().toISOString(),
      period,
      variants,
      totalExposures,
      errorRate: totalExposures > 0 ? (errors / totalExposures) * 100 : 0,
      isHealthy: !experiment?.killSwitch && !experiment?.autoDisabledReason,
    };
  }

  /**
   * Get all experiments metrics
   * READ-ONLY
   */
  getAllMetrics(): ExperimentMetrics[] {
    return EXPERIMENTS.map((exp) => this.getExperimentMetrics(exp.id));
  }

  /**
   * Get experiments health
   * READ-ONLY
   */
  getHealth(): ExperimentHealth {
    const flags = getFeatureFlags();
    const active = getActiveExperiments();
    const disabled = EXPERIMENTS.filter((e) => !e.enabled || e.killSwitch || e.autoDisabledReason);

    let totalExposures = 0;
    let totalErrors = 0;

    for (const exp of EXPERIMENTS) {
      totalExposures += this.getTotalExposures(exp.id);
      totalErrors += errorCounts.get(exp.id) || 0;
    }

    return {
      status: flags.EMERGENCY_DISABLE_ALL ? 'disabled' : active.length > 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      activeExperiments: active.length,
      disabledExperiments: disabled.length,
      totalExposures,
      errorRate: totalExposures > 0 ? (totalErrors / totalExposures) * 100 : 0,
      killSwitchActive: flags.EMERGENCY_DISABLE_ALL,
      featureFlags: {
        experimentsEnabled: flags.EXPERIMENTS_ENABLED,
        emergencyDisabled: flags.EMERGENCY_DISABLE_ALL,
      },
    };
  }

  /**
   * Activate kill switch for experiment
   */
  activateKillSwitch(experimentId: string, reason: string): boolean {
    const experiment = EXPERIMENTS.find((e) => e.id === experimentId);
    if (experiment) {
      experiment.killSwitch = true;
      this.logAudit({
        id: `audit_${Date.now()}`,
        experimentId,
        action: 'KILL_SWITCH',
        reason,
        timestamp: new Date().toISOString(),
      });
      return true;
    }
    return false;
  }

  /**
   * Auto-disable experiment on error spike
   */
  private autoDisableExperiment(experimentId: string, reason: string): void {
    const experiment = EXPERIMENTS.find((e) => e.id === experimentId);
    if (experiment && !experiment.autoDisabledReason) {
      experiment.autoDisabledReason = reason;
      experiment.enabled = false;
      this.logAudit({
        id: `audit_${Date.now()}`,
        experimentId,
        action: 'AUTO_DISABLE',
        reason,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Check and handle experiment expiry
   */
  checkExpiry(): void {
    const now = new Date();
    for (const experiment of EXPERIMENTS) {
      if (experiment.autoDisableOnExpiry && new Date(experiment.endDate) < now) {
        if (experiment.enabled && !experiment.autoDisabledReason) {
          experiment.enabled = false;
          experiment.autoDisabledReason = 'Experiment expired';
          this.logAudit({
            id: `audit_${Date.now()}`,
            experimentId: experiment.id,
            action: 'EXPIRY',
            reason: 'Automatic expiration',
            timestamp: new Date().toISOString(),
          });
        }
      }
    }
  }

  // ===========================================
  // Private Helpers
  // ===========================================

  private hashString(input: string): number {
    const hash = createHash('sha256').update(input).digest('hex');
    return parseInt(hash.slice(0, 8), 16);
  }

  private getTotalExposures(experimentId: string): number {
    const variantCounts = exposureCounts.get(experimentId);
    if (!variantCounts) return 0;
    let total = 0;
    variantCounts.forEach((count) => (total += count));
    return total;
  }

  private logAudit(entry: ExperimentAuditLog): void {
    auditLog.push(entry);
    if (auditLog.length > MAX_AUDIT_LOG) {
      auditLog.shift();
    }
  }

  /**
   * Get audit log (for debugging)
   * READ-ONLY
   */
  getAuditLog(experimentId?: string): ExperimentAuditLog[] {
    if (experimentId) {
      return auditLog.filter((e) => e.experimentId === experimentId);
    }
    return [...auditLog];
  }

  /**
   * Reset all counters (for testing only)
   */
  static resetCounters(): void {
    exposureCounts.clear();
    errorCounts.clear();
    auditLog.length = 0;
  }
}

export const experimentsService = new ExperimentsService();
