// Feature Service - Core Feature Flag Management
// خدمة الميزات - إدارة أعلام الميزات

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Cache TTL in seconds
const CACHE_TTL = 60;

// Types
type FeatureCategory = 'FINTECH' | 'LOGISTICS' | 'MARKETPLACE' | 'AI' | 'SECURITY' | 'COMMUNICATION' | 'ANALYTICS' | 'INTEGRATION' | 'EXPERIMENTAL';
type OverrideType = 'USER' | 'REGION' | 'SUBSCRIPTION' | 'ORGANIZATION';

interface Feature {
  id: string;
  key: string;
  name: string;
  nameAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  category: FeatureCategory;
  service: string;
  version: string;
  isEnabled: boolean;
  isPublic: boolean;
  isBeta: boolean;
  isPremium: boolean;
  rolloutPercentage: number;
  rolloutStrategy: string;
  dependsOn: string[];
  icon: string | null;
  color: string | null;
  overrides?: FeatureOverride[];
}

interface FeatureOverride {
  id: string;
  featureId: string;
  type: OverrideType;
  targetId: string;
  isEnabled: boolean;
  expiresAt: Date | null;
}

interface CreateFeatureDTO {
  key: string;
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  category: FeatureCategory;
  service: string;
  version?: string;
  isPremium?: boolean;
  isBeta?: boolean;
  dependsOn?: string[];
  icon?: string;
  color?: string;
  releaseNotes?: string;
  releaseNotesAr?: string;
  documentationUrl?: string;
}

interface FeatureCheckContext {
  userId?: string;
  region?: string;
  subscription?: string;
  organizationId?: string;
}

export class FeatureService {
  // ==========================================
  // 🚀 FEATURE CRUD
  // ==========================================

  // Create feature
  async createFeature(data: CreateFeatureDTO, createdBy: string): Promise<Feature> {
    const feature = await prisma.feature.create({
      data: {
        ...data,
        history: {
          create: {
            action: 'CREATED',
            newValue: data,
            changedBy: createdBy
          }
        }
      }
    });

    await this.invalidateCache(feature.key);
    return feature;
  }

  // Get feature by key
  async getFeatureByKey(key: string): Promise<Feature | null> {
    // Check cache first
    const cached = await redis.get(`feature:${key}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const feature = await prisma.feature.findUnique({
      where: { key },
      include: {
        overrides: true
      }
    });

    if (feature) {
      await redis.setex(`feature:${key}`, CACHE_TTL, JSON.stringify(feature));
    }

    return feature;
  }

  // Update feature
  async updateFeature(
    key: string,
    data: Partial<CreateFeatureDTO>,
    updatedBy: string
  ): Promise<Feature> {
    const current = await prisma.feature.findUnique({ where: { key } });
    
    const feature = await prisma.feature.update({
      where: { key },
      data: {
        ...data,
        history: {
          create: {
            action: 'UPDATED',
            previousValue: current,
            newValue: data,
            changedBy: updatedBy
          }
        }
      }
    });

    await this.invalidateCache(key);
    return feature;
  }

  // List features
  async listFeatures(filters?: {
    category?: FeatureCategory;
    service?: string;
    isEnabled?: boolean;
  }): Promise<Feature[]> {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.service) where.service = filters.service;
    if (filters?.isEnabled !== undefined) where.isEnabled = filters.isEnabled;

    return prisma.feature.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });
  }

  // ==========================================
  // 🎚️ FEATURE TOGGLE
  // ==========================================

  // Enable feature
  async enableFeature(key: string, enabledBy: string, reason?: string): Promise<Feature> {
    const feature = await prisma.feature.update({
      where: { key },
      data: {
        isEnabled: true,
        enabledAt: new Date(),
        disabledAt: null,
        history: {
          create: {
            action: 'ENABLED',
            changedBy: enabledBy,
            reason
          }
        }
      }
    });

    await this.invalidateCache(key);
    await this.notifyFeatureChange(key, 'enabled');
    return feature;
  }

  // Disable feature
  async disableFeature(key: string, disabledBy: string, reason?: string): Promise<Feature> {
    const feature = await prisma.feature.update({
      where: { key },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
        history: {
          create: {
            action: 'DISABLED',
            changedBy: disabledBy,
            reason
          }
        }
      }
    });

    await this.invalidateCache(key);
    await this.notifyFeatureChange(key, 'disabled');
    return feature;
  }

  // Set rollout percentage
  async setRolloutPercentage(
    key: string,
    percentage: number,
    changedBy: string
  ): Promise<Feature> {
    const feature = await prisma.feature.update({
      where: { key },
      data: {
        rolloutPercentage: Math.min(100, Math.max(0, percentage)),
        rolloutStrategy: 'PERCENTAGE',
        history: {
          create: {
            action: 'ROLLOUT_CHANGED',
            newValue: { rolloutPercentage: percentage },
            changedBy
          }
        }
      }
    });

    await this.invalidateCache(key);
    return feature;
  }

  // ==========================================
  // ✅ FEATURE CHECK
  // ==========================================

  // Check if feature is enabled for context
  async isFeatureEnabled(key: string, context?: FeatureCheckContext): Promise<boolean> {
    const feature = await this.getFeatureByKey(key);
    
    if (!feature) return false;
    if (!feature.isEnabled) return false;

    // Check dependencies
    if (feature.dependsOn && feature.dependsOn.length > 0) {
      for (const depKey of feature.dependsOn) {
        const depEnabled = await this.isFeatureEnabled(depKey, context);
        if (!depEnabled) return false;
      }
    }

    // Check overrides
    if (context) {
      const override = await this.checkOverride(feature.id, context);
      if (override !== null) return override;
    }

    // Check rollout strategy
    if (feature.rolloutStrategy === 'PERCENTAGE' && context?.userId) {
      return this.isInRolloutPercentage(context.userId, feature.rolloutPercentage);
    }

    // Check premium
    if (feature.isPremium && context?.subscription !== 'premium') {
      return false;
    }

    // Record metric
    await this.recordFeatureCheck(feature.id, true, context?.userId);

    return true;
  }

  // Check override for context
  private async checkOverride(
    featureId: string,
    context: FeatureCheckContext
  ): Promise<boolean | null> {
    const overrides = await prisma.featureOverride.findMany({
      where: {
        featureId,
        AND: [
          {
            OR: [
              { type: 'USER', targetId: context.userId },
              { type: 'REGION', targetId: context.region },
              { type: 'SUBSCRIPTION', targetId: context.subscription },
              { type: 'ORGANIZATION', targetId: context.organizationId }
            ]
          },
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } }
            ]
          }
        ]
      }
    });

    // User override takes precedence
    const userOverride = overrides.find((o: FeatureOverride) => o.type === 'USER');
    if (userOverride) return userOverride.isEnabled;

    // Then organization
    const orgOverride = overrides.find((o: FeatureOverride) => o.type === 'ORGANIZATION');
    if (orgOverride) return orgOverride.isEnabled;

    // Then subscription
    const subOverride = overrides.find((o: FeatureOverride) => o.type === 'SUBSCRIPTION');
    if (subOverride) return subOverride.isEnabled;

    // Then region
    const regionOverride = overrides.find((o: FeatureOverride) => o.type === 'REGION');
    if (regionOverride) return regionOverride.isEnabled;

    return null;
  }

  // Check if user is in rollout percentage
  private isInRolloutPercentage(userId: string, percentage: number): boolean {
    // Simple hash-based distribution
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    const userPercentage = Math.abs(hash % 100);
    return userPercentage < percentage;
  }

  // ==========================================
  // 🎯 OVERRIDES
  // ==========================================

  // Add override
  async addOverride(
    featureKey: string,
    type: 'USER' | 'REGION' | 'SUBSCRIPTION' | 'ORGANIZATION',
    targetId: string,
    isEnabled: boolean,
    createdBy: string,
    expiresAt?: Date
  ): Promise<any> {
    const feature = await prisma.feature.findUnique({ where: { key: featureKey } });
    if (!feature) throw new Error('Feature not found');

    const override = await prisma.featureOverride.upsert({
      where: {
        featureId_type_targetId: {
          featureId: feature.id,
          type,
          targetId
        }
      },
      create: {
        featureId: feature.id,
        type,
        targetId,
        isEnabled,
        expiresAt,
        createdBy
      },
      update: {
        isEnabled,
        expiresAt
      }
    });

    await prisma.featureHistory.create({
      data: {
        featureId: feature.id,
        action: 'OVERRIDE_ADDED',
        newValue: { type, targetId, isEnabled },
        changedBy: createdBy
      }
    });

    await this.invalidateCache(featureKey);
    return override;
  }

  // Remove override
  async removeOverride(
    featureKey: string,
    type: 'USER' | 'REGION' | 'SUBSCRIPTION' | 'ORGANIZATION',
    targetId: string,
    removedBy: string
  ): Promise<void> {
    const feature = await prisma.feature.findUnique({ where: { key: featureKey } });
    if (!feature) throw new Error('Feature not found');

    await prisma.featureOverride.delete({
      where: {
        featureId_type_targetId: {
          featureId: feature.id,
          type,
          targetId
        }
      }
    });

    await prisma.featureHistory.create({
      data: {
        featureId: feature.id,
        action: 'OVERRIDE_REMOVED',
        previousValue: { type, targetId },
        changedBy: removedBy
      }
    });

    await this.invalidateCache(featureKey);
  }

  // ==========================================
  // 📊 METRICS
  // ==========================================

  // Record feature check
  private async recordFeatureCheck(
    featureId: string,
    wasEnabled: boolean,
    userId?: string
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Use Redis for real-time counting, batch to DB
    const key = `feature_metrics:${featureId}:${today.toISOString().split('T')[0]}`;
    await redis.hincrby(key, 'totalChecks', 1);
    if (wasEnabled) {
      await redis.hincrby(key, 'enabledChecks', 1);
    }
    if (userId) {
      await redis.sadd(`${key}:users`, userId);
    }
    await redis.expire(key, 86400 * 2); // 2 days TTL
  }

  // Get feature metrics
  async getFeatureMetrics(featureKey: string, days: number = 30): Promise<any[]> {
    const feature = await prisma.feature.findUnique({ where: { key: featureKey } });
    if (!feature) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return prisma.featureMetrics.findMany({
      where: {
        featureId: feature.id,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });
  }

  // ==========================================
  // 🔧 UTILITIES
  // ==========================================

  // Invalidate cache
  private async invalidateCache(key: string): Promise<void> {
    await redis.del(`feature:${key}`);
  }

  // Notify feature change (for real-time updates)
  private async notifyFeatureChange(key: string, action: string): Promise<void> {
    await redis.publish('feature_changes', JSON.stringify({ key, action, timestamp: new Date() }));
  }

  // Get all enabled features for client
  async getEnabledFeaturesForClient(context?: FeatureCheckContext): Promise<{
    key: string;
    name: string;
    nameAr: string | null;
    category: string;
    isBeta: boolean;
    isPremium: boolean;
  }[]> {
    const features = await prisma.feature.findMany({
      where: { isEnabled: true, isPublic: true }
    });

    const enabledFeatures: {
      key: string;
      name: string;
      nameAr: string | null;
      category: string;
      isBeta: boolean;
      isPremium: boolean;
    }[] = [];
    
    for (const feature of features) {
      const isEnabled = await this.isFeatureEnabled(feature.key, context);
      if (isEnabled) {
        enabledFeatures.push({
          key: feature.key,
          name: feature.name,
          nameAr: feature.nameAr,
          category: feature.category,
          isBeta: feature.isBeta,
          isPremium: feature.isPremium
        });
      }
    }

    return enabledFeatures;
  }

  // Bulk check features
  async checkFeatures(keys: string[], context?: FeatureCheckContext): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    await Promise.all(
      keys.map(async (key) => {
        results[key] = await this.isFeatureEnabled(key, context);
      })
    );

    return results;
  }
}

export const featureService = new FeatureService();
