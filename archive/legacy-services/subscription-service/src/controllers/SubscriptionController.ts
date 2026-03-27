import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import SubscriptionGate from '../SubscriptionGate';

const prisma = new PrismaClient();

export class SubscriptionController {
  /**
   * Get all available subscription plans
   */
  async getAllPlans(req: Request, res: Response) {
    try {
      const plans = await prisma.subscriptionPlan.findMany({
        where: { isActive: true },
        orderBy: { price: 'asc' }
      });

      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription plans'
      });
    }
  }

  /**
   * Get all available features
   */
  async getAllFeatures(req: Request, res: Response) {
    try {
      const features = SubscriptionGate.getAllFeatures();

      res.json({
        success: true,
        data: features
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch features'
      });
    }
  }

  /**
   * Get user's current subscription
   */
  async getUserSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

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
        return res.json({
          success: true,
          data: null,
          message: 'No active subscription found'
        });
      }

      res.json({
        success: true,
        data: subscription
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user subscription'
      });
    }
  }

  /**
   * Create new subscription for user
   */
  async createSubscription(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { plan, durationMonths = 1 } = req.body;

      if (!plan || !['free', 'basic', 'premium'].includes(plan)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid plan specified'
        });
      }

      // Check if user already has an active subscription
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (existingSubscription) {
        return res.status(400).json({
          success: false,
          error: 'User already has an active subscription'
        });
      }

      const result = await SubscriptionGate.createSubscription(userId, plan, durationMonths);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.subscription,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to create subscription'
      });
    }
  }

  /**
   * Check feature access for user
   */
  async checkFeatureAccess(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { featureName } = req.body;

      if (!featureName) {
        return res.status(400).json({
          success: false,
          error: 'Feature name is required'
        });
      }

      const accessCheck = await SubscriptionGate.checkFeatureAccess(userId, featureName);

      res.json({
        success: true,
        data: accessCheck
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to check feature access'
      });
    }
  }

  /**
   * Record feature usage
   */
  async recordFeatureUsage(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { featureName } = req.body;

      if (!featureName) {
        return res.status(400).json({
          success: false,
          error: 'Feature name is required'
        });
      }

      // Record feature usage
      await prisma.featureUsage.upsert({
        where: {
          userId_featureName: {
            userId,
            featureName
          }
        },
        update: {
          usageCount: {
            increment: 1
          },
          lastUsedAt: new Date()
        },
        create: {
          userId,
          featureName,
          usageCount: 1,
          lastUsedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: 'Feature usage recorded'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to record feature usage'
      });
    }
  }

  /**
   * Toggle feature lock (admin only)
   */
  async toggleFeatureLock(req: Request, res: Response) {
    try {
      const { featureName } = req.params;
      const { isLocked } = req.body;

      if (typeof isLocked !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isLocked must be a boolean'
        });
      }

      const result = await SubscriptionGate.toggleFeatureLock(featureName, isLocked);

      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to toggle feature lock'
      });
    }
  }

  /**
   * Get all subscriptions (admin only)
   */
  async getAllSubscriptions(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50, plan, isActive } = req.query;

      const where: any = {};
      if (plan) where.plan = plan;
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [subscriptions, total] = await Promise.all([
        prisma.subscription.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }),
        prisma.subscription.count({ where })
      ]);

      res.json({
        success: true,
        data: subscriptions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit))
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscriptions'
      });
    }
  }

  /**
   * Get feature usage statistics (admin only)
   */
  async getFeatureUsageStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      const where: any = {};
      if (startDate || endDate) {
        where.lastUsedAt = {};
        if (startDate) where.lastUsedAt.gte = new Date(startDate as string);
        if (endDate) where.lastUsedAt.lte = new Date(endDate as string);
      }

      const usageStats = await prisma.featureUsage.findMany({
        where,
        orderBy: { usageCount: 'desc' }
      });

      // Calculate totals
      const totalUsage = usageStats.reduce((sum, stat) => sum + stat.usageCount, 0);

      res.json({
        success: true,
        data: usageStats,
        totals: {
          totalUsage,
          uniqueFeatures: usageStats.length,
          uniqueUsers: new Set(usageStats.map(stat => stat.userId)).size
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch feature usage statistics'
      });
    }
  }

  /**
   * Update subscription (admin only)
   */
  async updateSubscription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { plan, isActive, expiresAt } = req.body;

      const subscription = await prisma.subscription.update({
        where: { id },
        data: {
          ...(plan && { plan }),
          ...(isActive !== undefined && { isActive }),
          ...(expiresAt && { expiresAt: new Date(expiresAt) })
        }
      });

      res.json({
        success: true,
        data: subscription,
        message: 'Subscription updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to update subscription'
      });
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user.id;

      const subscription = await prisma.subscription.findFirst({
        where: {
          id,
          userId,
          isActive: true
        }
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: 'Subscription not found'
        });
      }

      await prisma.subscription.update({
        where: { id },
        data: {
          isActive: false
        }
      });

      // Record in history
      await prisma.subscriptionHistory.create({
        data: {
          userId,
          plan: subscription.plan,
          action: 'cancelled',
          reason: 'User requested cancellation'
        }
      });

      res.json({
        success: true,
        message: 'Subscription cancelled successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to cancel subscription'
      });
    }
  }
}