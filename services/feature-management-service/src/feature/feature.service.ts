import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type FeatureCategory = 'FINTECH' | 'LOGISTICS' | 'MARKETPLACE' | 'AI' | 'SECURITY' | 'COMMUNICATION' | 'ANALYTICS' | 'INTEGRATION' | 'EXPERIMENTAL';

interface FeatureCheckContext {
  userId?: string;
  region?: string;
  subscription?: string;
  organizationId?: string;
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

@Injectable()
export class FeatureService {
  private readonly logger = new Logger(FeatureService.name);
  private readonly redis: Redis;
  private readonly CACHE_TTL = 60;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );
    this.redis.on('error', (err) => this.logger.error('Redis error', err.message));
  }

  async createFeature(data: CreateFeatureDTO, createdBy: string) {
    const feature = await this.prisma.feature.create({
      data: {
        ...data,
        history: {
          create: { action: 'CREATED', newValue: data, changedBy: createdBy },
        },
      },
    });
    await this.invalidateCache(feature.key);
    return feature;
  }

  async getFeatureByKey(key: string) {
    const cached = await this.redis.get(`feature:${key}`);
    if (cached) return JSON.parse(cached);

    const feature = await this.prisma.feature.findUnique({
      where: { key },
      include: { overrides: true },
    });

    if (feature) {
      await this.redis.setex(`feature:${key}`, this.CACHE_TTL, JSON.stringify(feature));
    }
    return feature;
  }

  async updateFeature(key: string, data: Partial<CreateFeatureDTO>, updatedBy: string) {
    const current = await this.prisma.feature.findUnique({ where: { key } });
    const feature = await this.prisma.feature.update({
      where: { key },
      data: {
        ...data,
        history: {
          create: { action: 'UPDATED', previousValue: current, newValue: data, changedBy: updatedBy },
        },
      },
    });
    await this.invalidateCache(key);
    return feature;
  }

  async listFeatures(filters?: { category?: FeatureCategory; service?: string; isEnabled?: boolean }) {
    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.service) where.service = filters.service;
    if (filters?.isEnabled !== undefined) where.isEnabled = filters.isEnabled;

    return this.prisma.feature.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async enableFeature(key: string, enabledBy: string, reason?: string) {
    const feature = await this.prisma.feature.update({
      where: { key },
      data: {
        isEnabled: true,
        enabledAt: new Date(),
        disabledAt: null,
        history: { create: { action: 'ENABLED', changedBy: enabledBy, reason } },
      },
    });
    await this.invalidateCache(key);
    await this.notifyFeatureChange(key, 'enabled');
    return feature;
  }

  async disableFeature(key: string, disabledBy: string, reason?: string) {
    const feature = await this.prisma.feature.update({
      where: { key },
      data: {
        isEnabled: false,
        disabledAt: new Date(),
        history: { create: { action: 'DISABLED', changedBy: disabledBy, reason } },
      },
    });
    await this.invalidateCache(key);
    await this.notifyFeatureChange(key, 'disabled');
    return feature;
  }

  async setRolloutPercentage(key: string, percentage: number, changedBy: string) {
    const feature = await this.prisma.feature.update({
      where: { key },
      data: {
        rolloutPercentage: Math.min(100, Math.max(0, percentage)),
        rolloutStrategy: 'PERCENTAGE',
        history: { create: { action: 'ROLLOUT_CHANGED', newValue: { rolloutPercentage: percentage }, changedBy } },
      },
    });
    await this.invalidateCache(key);
    return feature;
  }

  async isFeatureEnabled(key: string, context?: FeatureCheckContext): Promise<boolean> {
    const feature = await this.getFeatureByKey(key);
    if (!feature) return false;
    if (!feature.isEnabled) return false;

    if (feature.dependsOn && feature.dependsOn.length > 0) {
      for (const depKey of feature.dependsOn) {
        const depEnabled = await this.isFeatureEnabled(depKey, context);
        if (!depEnabled) return false;
      }
    }

    if (context) {
      const override = await this.checkOverride(feature.id, context);
      if (override !== null) return override;
    }

    if (feature.rolloutStrategy === 'PERCENTAGE' && context?.userId) {
      return this.isInRolloutPercentage(context.userId, feature.rolloutPercentage);
    }

    if (feature.isPremium && context?.subscription !== 'premium') {
      return false;
    }

    await this.recordFeatureCheck(feature.id, true, context?.userId);
    return true;
  }

  private async checkOverride(featureId: string, context: FeatureCheckContext): Promise<boolean | null> {
    const overrides = await this.prisma.featureOverride.findMany({
      where: {
        featureId,
        AND: [
          {
            OR: [
              { type: 'USER', targetId: context.userId },
              { type: 'REGION', targetId: context.region },
              { type: 'SUBSCRIPTION', targetId: context.subscription },
              { type: 'ORGANIZATION', targetId: context.organizationId },
            ],
          },
          { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        ],
      },
    });

    const userOverride = overrides.find((o: any) => o.type === 'USER');
    if (userOverride) return userOverride.isEnabled;
    const orgOverride = overrides.find((o: any) => o.type === 'ORGANIZATION');
    if (orgOverride) return orgOverride.isEnabled;
    const subOverride = overrides.find((o: any) => o.type === 'SUBSCRIPTION');
    if (subOverride) return subOverride.isEnabled;
    const regionOverride = overrides.find((o: any) => o.type === 'REGION');
    if (regionOverride) return regionOverride.isEnabled;

    return null;
  }

  private isInRolloutPercentage(userId: string, percentage: number): boolean {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100) < percentage;
  }

  async addOverride(
    featureKey: string, type: 'USER' | 'REGION' | 'SUBSCRIPTION' | 'ORGANIZATION',
    targetId: string, isEnabled: boolean, createdBy: string, expiresAt?: Date,
  ) {
    const feature = await this.prisma.feature.findUnique({ where: { key: featureKey } });
    if (!feature) throw new Error('Feature not found');

    const override = await this.prisma.featureOverride.upsert({
      where: { featureId_type_targetId: { featureId: feature.id, type, targetId } },
      create: { featureId: feature.id, type, targetId, isEnabled, expiresAt, createdBy },
      update: { isEnabled, expiresAt },
    });

    await this.prisma.featureHistory.create({
      data: { featureId: feature.id, action: 'OVERRIDE_ADDED', newValue: { type, targetId, isEnabled }, changedBy: createdBy },
    });

    await this.invalidateCache(featureKey);
    return override;
  }

  async removeOverride(
    featureKey: string, type: 'USER' | 'REGION' | 'SUBSCRIPTION' | 'ORGANIZATION',
    targetId: string, removedBy: string,
  ) {
    const feature = await this.prisma.feature.findUnique({ where: { key: featureKey } });
    if (!feature) throw new Error('Feature not found');

    await this.prisma.featureOverride.delete({
      where: { featureId_type_targetId: { featureId: feature.id, type, targetId } },
    });

    await this.prisma.featureHistory.create({
      data: { featureId: feature.id, action: 'OVERRIDE_REMOVED', previousValue: { type, targetId }, changedBy: removedBy },
    });

    await this.invalidateCache(featureKey);
  }

  private async recordFeatureCheck(featureId: string, wasEnabled: boolean, userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const key = `feature_metrics:${featureId}:${today.toISOString().split('T')[0]}`;
    await this.redis.hincrby(key, 'totalChecks', 1);
    if (wasEnabled) await this.redis.hincrby(key, 'enabledChecks', 1);
    if (userId) await this.redis.sadd(`${key}:users`, userId);
    await this.redis.expire(key, 86400 * 2);
  }

  async getFeatureMetrics(featureKey: string, days: number = 30) {
    const feature = await this.prisma.feature.findUnique({ where: { key: featureKey } });
    if (!feature) return [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    return this.prisma.featureMetrics.findMany({
      where: { featureId: feature.id, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });
  }

  private async invalidateCache(key: string) {
    await this.redis.del(`feature:${key}`);
  }

  private async notifyFeatureChange(key: string, action: string) {
    await this.redis.publish('feature_changes', JSON.stringify({ key, action, timestamp: new Date() }));
  }

  async getEnabledFeaturesForClient(context?: FeatureCheckContext) {
    const features = await this.prisma.feature.findMany({
      where: { isEnabled: true, isPublic: true },
    });

    const enabledFeatures: { key: string; name: string; nameAr: string | null; category: string; isBeta: boolean; isPremium: boolean }[] = [];
    for (const feature of features) {
      const isEnabled = await this.isFeatureEnabled(feature.key, context);
      if (isEnabled) {
        enabledFeatures.push({
          key: feature.key, name: feature.name, nameAr: feature.nameAr,
          category: feature.category, isBeta: feature.isBeta, isPremium: feature.isPremium,
        });
      }
    }
    return enabledFeatures;
  }

  async checkFeatures(keys: string[], context?: FeatureCheckContext): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    await Promise.all(keys.map(async (key) => { results[key] = await this.isFeatureEnabled(key, context); }));
    return results;
  }
}
