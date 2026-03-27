/**
 * Abuse Guard Service
 * Sprint 3: Market Hardening & Go-Live Safety
 *
 * Detects and prevents:
 * - Repeated intent spam
 * - Offer flooding
 * - Corridor volume abuse
 *
 * CONSTRAINTS:
 * - Soft throttling with warnings
 * - No blocking without explanation
 * - Feature-flagged
 */

import { getFeatureFlags } from '../config/feature-flags';
import { structuredLog, LogLevel } from './structured-logger.service';

// Abuse detection thresholds
export interface AbuseThresholds {
  intentSpam: {
    maxPerMinute: number;
    maxPerHour: number;
    cooldownMinutes: number;
  };
  offerFlooding: {
    maxPerMinute: number;
    maxPerHour: number;
    cooldownMinutes: number;
  };
  corridorVolume: {
    maxDailyVolumeUSD: number;
    maxDailyTransactions: number;
    warningThresholdPercent: number;
  };
}

export const DEFAULT_THRESHOLDS: AbuseThresholds = {
  intentSpam: {
    maxPerMinute: 10,
    maxPerHour: 100,
    cooldownMinutes: 5,
  },
  offerFlooding: {
    maxPerMinute: 5,
    maxPerHour: 50,
    cooldownMinutes: 10,
  },
  corridorVolume: {
    maxDailyVolumeUSD: 50000, // Per corridor per day
    maxDailyTransactions: 500,
    warningThresholdPercent: 80,
  },
};

// Abuse tracking stores
interface ActivityEntry {
  timestamps: number[];
  warnings: number;
  cooldownUntil?: number;
}

interface CorridorVolumeEntry {
  date: string;
  volumeUSD: number;
  transactionCount: number;
}

const intentActivityStore: Map<string, ActivityEntry> = new Map();
const offerActivityStore: Map<string, ActivityEntry> = new Map();
const corridorVolumeStore: Map<string, CorridorVolumeEntry> = new Map();

// Cleanup old entries
setInterval(
  () => {
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;

    for (const [key, entry] of intentActivityStore.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => t > hourAgo);
      if (entry.timestamps.length === 0 && (!entry.cooldownUntil || entry.cooldownUntil < now)) {
        intentActivityStore.delete(key);
      }
    }

    for (const [key, entry] of offerActivityStore.entries()) {
      entry.timestamps = entry.timestamps.filter((t) => t > hourAgo);
      if (entry.timestamps.length === 0 && (!entry.cooldownUntil || entry.cooldownUntil < now)) {
        offerActivityStore.delete(key);
      }
    }

    // Clean up old corridor volume entries (keep only today)
    const today = new Date().toISOString().split('T')[0];
    for (const [key, entry] of corridorVolumeStore.entries()) {
      if (entry.date !== today) {
        corridorVolumeStore.delete(key);
      }
    }
  },
  5 * 60 * 1000
); // Every 5 minutes

export interface AbuseCheckResult {
  allowed: boolean;
  warning?: string;
  cooldownUntil?: Date;
  reason?: string;
  suggestions?: string[];
}

/**
 * Abuse Guard Service
 */
export class AbuseGuardService {
  private thresholds: AbuseThresholds;

  constructor(customThresholds?: Partial<AbuseThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...customThresholds };
  }

  /**
   * Check for intent classification spam
   */
  checkIntentSpam(userId: string, ip: string): AbuseCheckResult {
    const flags = getFeatureFlags();
    if (!flags.ABUSE_GUARDS_ENABLED) {
      return { allowed: true };
    }

    const key = `intent:${userId}:${ip}`;
    const now = Date.now();
    const entry = intentActivityStore.get(key) || { timestamps: [], warnings: 0 };

    // Check cooldown
    if (entry.cooldownUntil && entry.cooldownUntil > now) {
      return {
        allowed: false,
        cooldownUntil: new Date(entry.cooldownUntil),
        reason: 'Too many intent classification requests. Please wait before trying again.',
        suggestions: ['Wait for the cooldown period to end', 'Reduce request frequency'],
      };
    }

    // Add current timestamp
    entry.timestamps.push(now);
    intentActivityStore.set(key, entry);

    // Check per-minute limit
    const minuteAgo = now - 60 * 1000;
    const recentCount = entry.timestamps.filter((t) => t > minuteAgo).length;

    if (recentCount > this.thresholds.intentSpam.maxPerMinute) {
      entry.cooldownUntil = now + this.thresholds.intentSpam.cooldownMinutes * 60 * 1000;
      entry.warnings++;
      intentActivityStore.set(key, entry);

      structuredLog(LogLevel.WARN, 'Intent spam detected', {
        userId,
        ip,
        recentCount,
        threshold: this.thresholds.intentSpam.maxPerMinute,
        cooldownMinutes: this.thresholds.intentSpam.cooldownMinutes,
      });

      return {
        allowed: false,
        cooldownUntil: new Date(entry.cooldownUntil),
        reason: `Intent classification rate exceeded (${recentCount}/${this.thresholds.intentSpam.maxPerMinute} per minute)`,
        suggestions: ['Reduce request frequency', 'Cache intent results client-side'],
      };
    }

    // Check per-hour limit
    const hourAgo = now - 60 * 60 * 1000;
    const hourlyCount = entry.timestamps.filter((t) => t > hourAgo).length;

    if (hourlyCount > this.thresholds.intentSpam.maxPerHour) {
      entry.cooldownUntil = now + this.thresholds.intentSpam.cooldownMinutes * 60 * 1000;
      entry.warnings++;
      intentActivityStore.set(key, entry);

      return {
        allowed: false,
        cooldownUntil: new Date(entry.cooldownUntil),
        reason: `Hourly intent classification limit exceeded (${hourlyCount}/${this.thresholds.intentSpam.maxPerHour})`,
        suggestions: ['Reduce request frequency', 'Batch intent classifications'],
      };
    }

    // Warning at 80% of limit
    const warningThreshold = Math.floor(this.thresholds.intentSpam.maxPerMinute * 0.8);
    if (recentCount >= warningThreshold) {
      return {
        allowed: true,
        warning: `Approaching intent classification limit (${recentCount}/${this.thresholds.intentSpam.maxPerMinute} per minute)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check for offer flooding
   */
  checkOfferFlooding(userId: string, ip: string): AbuseCheckResult {
    const flags = getFeatureFlags();
    if (!flags.ABUSE_GUARDS_ENABLED) {
      return { allowed: true };
    }

    const key = `offer:${userId}:${ip}`;
    const now = Date.now();
    const entry = offerActivityStore.get(key) || { timestamps: [], warnings: 0 };

    // Check cooldown
    if (entry.cooldownUntil && entry.cooldownUntil > now) {
      return {
        allowed: false,
        cooldownUntil: new Date(entry.cooldownUntil),
        reason: 'Too many offer requests. Please wait before trying again.',
        suggestions: ['Wait for the cooldown period to end', 'Review existing offers before creating new ones'],
      };
    }

    entry.timestamps.push(now);
    offerActivityStore.set(key, entry);

    // Check per-minute limit
    const minuteAgo = now - 60 * 1000;
    const recentCount = entry.timestamps.filter((t) => t > minuteAgo).length;

    if (recentCount > this.thresholds.offerFlooding.maxPerMinute) {
      entry.cooldownUntil = now + this.thresholds.offerFlooding.cooldownMinutes * 60 * 1000;
      entry.warnings++;
      offerActivityStore.set(key, entry);

      structuredLog(LogLevel.WARN, 'Offer flooding detected', {
        userId,
        ip,
        recentCount,
        threshold: this.thresholds.offerFlooding.maxPerMinute,
      });

      return {
        allowed: false,
        cooldownUntil: new Date(entry.cooldownUntil),
        reason: `Offer creation rate exceeded (${recentCount}/${this.thresholds.offerFlooding.maxPerMinute} per minute)`,
        suggestions: ['Review existing offers', 'Wait before creating more offers'],
      };
    }

    // Warning at 80%
    const warningThreshold = Math.floor(this.thresholds.offerFlooding.maxPerMinute * 0.8);
    if (recentCount >= warningThreshold) {
      return {
        allowed: true,
        warning: `Approaching offer creation limit (${recentCount}/${this.thresholds.offerFlooding.maxPerMinute} per minute)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Check corridor daily volume cap
   */
  checkCorridorVolume(corridorId: string, transactionValueUSD: number): AbuseCheckResult {
    const flags = getFeatureFlags();
    if (!flags.CORRIDOR_CAPS_ENABLED) {
      return { allowed: true };
    }

    const today = new Date().toISOString().split('T')[0];
    const key = `${corridorId}:${today}`;
    const entry = corridorVolumeStore.get(key) || { date: today, volumeUSD: 0, transactionCount: 0 };

    const projectedVolume = entry.volumeUSD + transactionValueUSD;
    const projectedCount = entry.transactionCount + 1;

    // Check volume cap
    if (projectedVolume > this.thresholds.corridorVolume.maxDailyVolumeUSD) {
      structuredLog(LogLevel.WARN, 'Corridor volume cap reached', {
        corridorId,
        currentVolume: entry.volumeUSD,
        projectedVolume,
        cap: this.thresholds.corridorVolume.maxDailyVolumeUSD,
      });

      return {
        allowed: false,
        reason: `Daily volume cap reached for corridor ${corridorId}`,
        suggestions: ['Try again tomorrow', 'Use a different corridor', 'Split into smaller transactions'],
      };
    }

    // Check transaction count cap
    if (projectedCount > this.thresholds.corridorVolume.maxDailyTransactions) {
      return {
        allowed: false,
        reason: `Daily transaction limit reached for corridor ${corridorId}`,
        suggestions: ['Try again tomorrow', 'Use a different corridor'],
      };
    }

    // Update volume (only if allowed)
    entry.volumeUSD = projectedVolume;
    entry.transactionCount = projectedCount;
    corridorVolumeStore.set(key, entry);

    // Warning at threshold
    const warningVolume = this.thresholds.corridorVolume.maxDailyVolumeUSD * (this.thresholds.corridorVolume.warningThresholdPercent / 100);
    if (projectedVolume >= warningVolume) {
      return {
        allowed: true,
        warning: `Approaching daily volume cap for ${corridorId} (${Math.round((projectedVolume / this.thresholds.corridorVolume.maxDailyVolumeUSD) * 100)}% used)`,
      };
    }

    return { allowed: true };
  }

  /**
   * Get corridor volume status
   */
  getCorridorVolumeStatus(corridorId: string): {
    volumeUSD: number;
    transactionCount: number;
    remainingVolumeUSD: number;
    remainingTransactions: number;
    percentUsed: number;
  } {
    const today = new Date().toISOString().split('T')[0];
    const key = `${corridorId}:${today}`;
    const entry = corridorVolumeStore.get(key) || { date: today, volumeUSD: 0, transactionCount: 0 };

    return {
      volumeUSD: entry.volumeUSD,
      transactionCount: entry.transactionCount,
      remainingVolumeUSD: Math.max(0, this.thresholds.corridorVolume.maxDailyVolumeUSD - entry.volumeUSD),
      remainingTransactions: Math.max(0, this.thresholds.corridorVolume.maxDailyTransactions - entry.transactionCount),
      percentUsed: Math.round((entry.volumeUSD / this.thresholds.corridorVolume.maxDailyVolumeUSD) * 100),
    };
  }

  /**
   * Reset abuse tracking for testing
   */
  static resetAll(): void {
    intentActivityStore.clear();
    offerActivityStore.clear();
    corridorVolumeStore.clear();
  }
}

export const abuseGuardService = new AbuseGuardService();
