import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  SubscriptionFeature,
  FeatureAccessResult,
  SubscriptionResult,
  PLAN_HIERARCHY,
} from './entities/subscription.entity';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  /**
   * Feature configuration - centralized control
   */
  private readonly FEATURES: Record<string, SubscriptionFeature> = {
    'request-item-from-traveler': {
      featureName: 'request-item-from-traveler',
      isLocked: true,
      requiredPlan: 'premium',
      description: 'Request items from travelers',
      price: 9.99,
    },
    'create-product': {
      featureName: 'create-product',
      isLocked: true,
      requiredPlan: 'seller-basic',
      description: 'Create product listings - requires seller subscription',
      price: 19.99,
    },
    'publish-product': {
      featureName: 'publish-product',
      isLocked: true,
      requiredPlan: 'seller-basic',
      description: 'Publish products to marketplace - requires seller subscription',
      price: 19.99,
    },
    'seller-dashboard': {
      featureName: 'seller-dashboard',
      isLocked: true,
      requiredPlan: 'seller-basic',
      description: 'Access seller dashboard and analytics',
      price: 19.99,
    },
    'send-messages': {
      featureName: 'send-messages',
      isLocked: true,
      requiredPlan: 'basic',
      description: 'Send messages to travelers',
      price: 4.99,
    },
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all features and their status
   */
  getAllFeatures(): SubscriptionFeature[] {
    return Object.values(this.FEATURES);
  }

  /**
   * Check if user has access to a specific feature
   */
  async checkFeatureAccess(userId: string, featureName: string): Promise<FeatureAccessResult> {
    const feature = this.FEATURES[featureName];

    if (!feature) {
      return { hasAccess: false, reason: 'Feature not found' };
    }

    if (!feature.isLocked) {
      return { hasAccess: true };
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });

    if (!subscription) {
      return {
        hasAccess: false,
        reason: 'No active subscription',
        requiredPlan: feature.requiredPlan,
        currentPlan: 'none',
        upgradeUrl: '/subscribe',
      };
    }

    const hasRequiredPlan = this.hasPlanAccess(subscription.plan, feature.requiredPlan);

    if (!hasRequiredPlan) {
      return {
        hasAccess: false,
        reason: 'Plan upgrade required',
        requiredPlan: feature.requiredPlan,
        currentPlan: subscription.plan,
        upgradeUrl: '/upgrade',
      };
    }

    return { hasAccess: true, currentPlan: subscription.plan };
  }

  /**
   * Create a new subscription for a user
   */
  async createSubscription(
    userId: string,
    plan: string,
    durationMonths: number,
  ): Promise<SubscriptionResult> {
    try {
      // Deactivate existing subscriptions
      await this.prisma.subscription.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan,
          isActive: true,
          expiresAt,
          features: this.getFeaturesForPlan(plan),
        },
      });

      return {
        success: true,
        subscription,
        message: 'Subscription created successfully',
      };
    } catch (error) {
      this.logger.error('Create Subscription Error:', error);
      return { success: false, message: 'Failed to create subscription' };
    }
  }

  /**
   * Admin override to manually activate/deactivate seller subscription
   */
  async adminOverrideSubscription(
    userId: string,
    action: 'activate' | 'deactivate',
    plan?: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (action === 'activate') {
        await this.prisma.subscription.updateMany({
          where: { userId, isActive: true },
          data: { isActive: false },
        });

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await this.prisma.subscription.create({
          data: {
            userId,
            plan: plan || 'seller-basic',
            isActive: true,
            expiresAt,
            features: this.getFeaturesForPlan(plan || 'seller-basic'),
          },
        });

        return {
          success: true,
          message: `Seller subscription activated with ${plan || 'seller-basic'} plan`,
        };
      } else {
        await this.prisma.subscription.updateMany({
          where: { userId },
          data: { isActive: false },
        });

        return { success: true, message: 'Seller subscription deactivated' };
      }
    } catch (error) {
      this.logger.error('Admin Override Error:', error);
      return { success: false, message: 'Failed to override subscription' };
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(userId: string): Promise<any | null> {
    return this.prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });
  }

  /**
   * Check if user's plan has access to required plan
   */
  private hasPlanAccess(userPlan: string, requiredPlan: string): boolean {
    const userPlanLevel = PLAN_HIERARCHY[userPlan] || 0;
    const requiredPlanLevel = PLAN_HIERARCHY[requiredPlan] || 0;
    return userPlanLevel >= requiredPlanLevel;
  }

  /**
   * Get features available for a specific plan
   */
  private getFeaturesForPlan(plan: string): string[] {
    return Object.values(this.FEATURES)
      .filter((feature) => {
        if (plan === 'premium') return true;
        if (plan === 'seller-pro') return feature.requiredPlan !== 'premium';
        if (plan === 'seller-basic')
          return feature.requiredPlan === 'seller-basic' || feature.requiredPlan === 'free';
        if (plan === 'basic')
          return feature.requiredPlan === 'basic' || feature.requiredPlan === 'free';
        if (plan === 'free') return feature.requiredPlan === 'free';
        return false;
      })
      .map((feature) => feature.featureName);
  }
}
