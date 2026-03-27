import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface SubscriptionFeature {
  featureName: string;
  isLocked: boolean;
  requiredPlan: string;
  description: string;
  price?: number;
}

export interface UserSubscription {
  userId: string;
  plan: string;
  isActive: boolean;
  expiresAt: Date;
  features: string[];
}

export class SubscriptionGate {
  /**
   * Feature configuration - centralized control
   */
  private static readonly FEATURES: Record<string, SubscriptionFeature> = {
    'request-item-from-traveler': {
      featureName: 'request-item-from-traveler',
      isLocked: true,
      requiredPlan: 'premium',
      description: 'Request items from travelers',
      price: 9.99
    },
    'create-product': {
      featureName: 'create-product',
      isLocked: true, // SELLER SUBSCRIPTION REQUIRED
      requiredPlan: 'seller-basic',
      description: 'Create product listings - requires seller subscription',
      price: 19.99
    },
    'publish-product': {
      featureName: 'publish-product',
      isLocked: true, // SELLER SUBSCRIPTION REQUIRED
      requiredPlan: 'seller-basic',
      description: 'Publish products to marketplace - requires seller subscription',
      price: 19.99
    },
    'seller-dashboard': {
      featureName: 'seller-dashboard',
      isLocked: true, // SELLER SUBSCRIPTION REQUIRED
      requiredPlan: 'seller-basic',
      description: 'Access seller dashboard and analytics',
      price: 19.99
    },
    'send-messages': {
      featureName: 'send-messages',
      isLocked: true,
      requiredPlan: 'basic',
      description: 'Send messages to travelers',
      price: 4.99
    }
  };

  /**
   * Check if user has access to a specific feature
   */
  static async checkFeatureAccess(userId: string, featureName: string): Promise<{
    hasAccess: boolean;
    reason?: string;
    requiredPlan?: string;
    currentPlan?: string;
    upgradeUrl?: string;
  }> {
    const feature = this.FEATURES[featureName];
    
    if (!feature) {
      return {
        hasAccess: false,
        reason: 'Feature not found'
      };
    }

    // If feature is not locked, allow access
    if (!feature.isLocked) {
      return {
        hasAccess: true
      };
    }

    // Get user's subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!subscription) {
      return {
        hasAccess: false,
        reason: 'No active subscription',
        requiredPlan: feature.requiredPlan,
        currentPlan: 'none',
        upgradeUrl: '/subscribe'
      };
    }

    // Check if user's plan includes this feature
    const hasRequiredPlan = this.hasPlanAccess(subscription.plan, feature.requiredPlan);

    if (!hasRequiredPlan) {
      return {
        hasAccess: false,
        reason: 'Plan upgrade required',
        requiredPlan: feature.requiredPlan,
        currentPlan: subscription.plan,
        upgradeUrl: '/upgrade'
      };
    }

    return {
      hasAccess: true,
      currentPlan: subscription.plan
    };
  }

  /**
   * Check if user's plan has access to required plan
   */
  private static hasPlanAccess(userPlan: string, requiredPlan: string): boolean {
    // Plan hierarchy: premium > seller-pro > seller-basic > basic > free
    const planHierarchy = {
      'premium': 5,
      'seller-pro': 4,
      'seller-basic': 3,
      'basic': 2,
      'free': 1
    };

    const userPlanLevel = planHierarchy[userPlan] || 0;
    const requiredPlanLevel = planHierarchy[requiredPlan] || 0;

    return userPlanLevel >= requiredPlanLevel;
  }

  /**
   * Middleware to protect routes with subscription check
   */
  static requireSubscription(featureName: string) {
    return async (req: Request, res: Response, next: Function) => {
      try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return res.status(401).json({
            success: false,
            error: 'Authentication required',
            action: 'login'
          });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const userId = decoded.id;

        const accessCheck = await this.checkFeatureAccess(userId, featureName);

        if (!accessCheck.hasAccess) {
          return res.status(403).json({
            success: false,
            error: accessCheck.reason,
            feature: featureName,
            requiredPlan: accessCheck.requiredPlan,
            currentPlan: accessCheck.currentPlan,
            action: 'upgrade',
            upgradeUrl: accessCheck.upgradeUrl,
            message: `Upgrade to ${accessCheck.requiredPlan} plan to access this feature`
          });
        }

        // Add subscription info to request for downstream use
        (req as any).subscription = {
          userId,
          plan: accessCheck.currentPlan,
          hasAccess: true
        };

        next();
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid authentication'
        });
      }
    };
  }

  /**
   * Admin endpoint to toggle feature locks
   */
  static async toggleFeatureLock(featureName: string, isLocked: boolean): Promise<{
    success: boolean;
    message: string;
  }> {
    if (!this.FEATURES[featureName]) {
      return {
        success: false,
        message: 'Feature not found'
      };
    }

    this.FEATURES[featureName].isLocked = isLocked;

    return {
      success: true,
      message: `Feature "${featureName}" ${isLocked ? 'locked' : 'unlocked'} successfully`
    };
  }

  /**
   * Get all features and their status
   */
  static getAllFeatures(): SubscriptionFeature[] {
    return Object.values(this.FEATURES);
  }

  /**
   * Create a new subscription for a user
   */
  static async createSubscription(userId: string, plan: string, durationMonths: number): Promise<{
    success: boolean;
    subscription?: any;
    message: string;
  }> {
    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

      const subscription = await prisma.subscription.create({
        data: {
          userId,
          plan,
          isActive: true,
          expiresAt,
          features: this.getFeaturesForPlan(plan)
        }
      });

      return {
        success: true,
        subscription,
        message: 'Subscription created successfully'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create subscription'
      };
    }
  }

  /**
   * Admin override to manually activate/deactivate seller subscription
   */
  static async adminOverrideSubscription(userId: string, action: 'activate' | 'deactivate', plan?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      if (action === 'activate') {
        // Create or update subscription
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month by default

        await prisma.subscription.upsert({
          where: { userId },
          update: {
            plan: plan || 'seller-basic',
            isActive: true,
            expiresAt,
            features: this.getFeaturesForPlan(plan || 'seller-basic')
          },
          create: {
            userId,
            plan: plan || 'seller-basic',
            isActive: true,
            expiresAt,
            features: this.getFeaturesForPlan(plan || 'seller-basic')
          }
        });

        return {
          success: true,
          message: `Seller subscription activated with ${plan || 'seller-basic'} plan`
        };
      } else {
        // Deactivate subscription
        await prisma.subscription.updateMany({
          where: { userId },
          data: { isActive: false }
        });

        return {
          success: true,
          message: 'Seller subscription deactivated'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: 'Failed to override subscription'
      };
    }
  }

  /**
   * Get features available for a specific plan
   */
  private static getFeaturesForPlan(plan: string): string[] {
    return Object.values(this.FEATURES)
      .filter(feature => {
        if (plan === 'premium') return true; // Premium gets all features
        if (plan === 'seller-pro') return feature.requiredPlan !== 'premium';
        if (plan === 'seller-basic') return feature.requiredPlan === 'seller-basic' || feature.requiredPlan === 'free';
        if (plan === 'basic') return feature.requiredPlan === 'basic' || feature.requiredPlan === 'free';
        if (plan === 'free') return feature.requiredPlan === 'free';
        return false;
      })
      .map(feature => feature.featureName);
  }
}

export default SubscriptionGate;