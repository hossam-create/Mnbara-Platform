import { PrismaClient } from '@prisma/client';
import { PostHogService } from './posthog.service';
import { PlausibleService } from './plausible.service';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface TrackEventInput {
  userId?: string;
  sessionId?: string;
  eventName: string;
  properties?: Record<string, any>;
  url?: string;
  referrer?: string;
}

export interface TrackPageViewInput {
  userId?: string;
  sessionId: string;
  url: string;
  referrer?: string;
  userAgent?: string;
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
}

export class AnalyticsService {
  private posthog: PostHogService;
  private plausible: PlausibleService;

  constructor() {
    this.posthog = new PostHogService();
    this.plausible = new PlausibleService();
  }

  // Track event (dual tracking)
  async trackEvent(input: TrackEventInput) {
    try {
      // Store in database
      await prisma.event.create({
        data: {
          userId: input.userId,
          sessionId: input.sessionId,
          eventName: input.eventName,
          properties: input.properties || {},
          source: 'custom'
        }
      });

      // Send to PostHog
      if (input.userId || input.sessionId) {
        await this.posthog.captureEvent({
          distinctId: input.userId || input.sessionId!,
          event: input.eventName,
          properties: input.properties
        });
      }

      // Send to Plausible (if URL provided)
      if (input.url) {
        const domain = process.env.PLAUSIBLE_DOMAIN || 'mnbara.com';
        await this.plausible.sendEvent({
          domain,
          name: input.eventName,
          url: input.url,
          referrer: input.referrer,
          props: input.properties as Record<string, string | number>
        });
      }

      logger.info(`Event tracked: ${input.eventName}`);
    } catch (error) {
      logger.error('Track event error:', error);
      throw error;
    }
  }

  // Track page view
  async trackPageView(input: TrackPageViewInput) {
    try {
      await prisma.pageView.create({
        data: {
          userId: input.userId,
          sessionId: input.sessionId,
          url: input.url,
          referrer: input.referrer,
          userAgent: input.userAgent,
          country: input.country,
          device: input.device,
          browser: input.browser,
          os: input.os
        }
      });

      // Send to PostHog
      await this.posthog.captureEvent({
        distinctId: input.userId || input.sessionId,
        event: '$pageview',
        properties: {
          $current_url: input.url,
          $referrer: input.referrer
        }
      });

      // Send to Plausible
      const domain = process.env.PLAUSIBLE_DOMAIN || 'mnbara.com';
      await this.plausible.sendEvent({
        domain,
        name: 'pageview',
        url: input.url,
        referrer: input.referrer
      });

      logger.info(`Page view tracked: ${input.url}`);
    } catch (error) {
      logger.error('Track page view error:', error);
      throw error;
    }
  }

  // Identify user
  async identifyUser(userId: string, properties: Record<string, any>) {
    try {
      await this.posthog.identify({
        distinctId: userId,
        properties
      });

      logger.info(`User identified: ${userId}`);
    } catch (error) {
      logger.error('Identify user error:', error);
      throw error;
    }
  }

  // Get event analytics
  async getEventAnalytics(eventName: string, startDate: Date, endDate: Date) {
    try {
      const events = await prisma.event.findMany({
        where: {
          eventName,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      const totalCount = events.length;
      const uniqueUsers = new Set(events.filter(e => e.userId).map(e => e.userId)).size;
      const uniqueSessions = new Set(events.filter(e => e.sessionId).map(e => e.sessionId)).size;

      return {
        eventName,
        totalCount,
        uniqueUsers,
        uniqueSessions,
        events: events.slice(0, 100) // Return first 100
      };
    } catch (error) {
      logger.error('Get event analytics error:', error);
      throw error;
    }
  }

  // Get page view analytics
  async getPageViewAnalytics(url: string, startDate: Date, endDate: Date) {
    try {
      const pageViews = await prisma.pageView.findMany({
        where: {
          url,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const totalViews = pageViews.length;
      const uniqueUsers = new Set(pageViews.filter(pv => pv.userId).map(pv => pv.userId)).size;
      const uniqueSessions = new Set(pageViews.map(pv => pv.sessionId)).size;

      // Calculate average duration
      const durationsWithValues = pageViews.filter(pv => pv.duration !== null);
      const avgDuration = durationsWithValues.length > 0
        ? durationsWithValues.reduce((sum, pv) => sum + (pv.duration || 0), 0) / durationsWithValues.length
        : 0;

      return {
        url,
        totalViews,
        uniqueUsers,
        uniqueSessions,
        avgDuration: Math.round(avgDuration)
      };
    } catch (error) {
      logger.error('Get page view analytics error:', error);
      throw error;
    }
  }

  // Create funnel
  async createFunnel(name: string, steps: any[], description?: string) {
    try {
      const funnel = await prisma.funnel.create({
        data: {
          name,
          steps,
          description
        }
      });

      return funnel;
    } catch (error) {
      logger.error('Create funnel error:', error);
      throw error;
    }
  }

  // Analyze funnel
  async analyzeFunnel(funnelId: string, startDate: Date, endDate: Date) {
    try {
      const funnel = await prisma.funnel.findUnique({
        where: { id: funnelId }
      });

      if (!funnel) {
        throw new Error('Funnel not found');
      }

      const steps = funnel.steps as any[];
      const results = [];

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const count = await prisma.event.count({
          where: {
            eventName: step.eventName,
            timestamp: {
              gte: startDate,
              lte: endDate
            }
          }
        });

        const conversionRate = i > 0 && results[i - 1].count > 0
          ? (count / results[i - 1].count) * 100
          : 100;

        results.push({
          step: i + 1,
          name: step.name,
          eventName: step.eventName,
          count,
          conversionRate: Math.round(conversionRate * 100) / 100
        });
      }

      return {
        funnel: funnel.name,
        steps: results,
        overallConversion: results.length > 0
          ? Math.round((results[results.length - 1].count / results[0].count) * 10000) / 100
          : 0
      };
    } catch (error) {
      logger.error('Analyze funnel error:', error);
      throw error;
    }
  }

  // Create cohort
  async createCohort(name: string, filters: any, description?: string) {
    try {
      const cohort = await prisma.cohort.create({
        data: {
          name,
          filters,
          description
        }
      });

      return cohort;
    } catch (error) {
      logger.error('Create cohort error:', error);
      throw error;
    }
  }

  // Get dashboard stats
  async getDashboardStats(startDate: Date, endDate: Date) {
    try {
      const [totalEvents, totalPageViews, uniqueUsers, uniqueSessions] = await Promise.all([
        prisma.event.count({
          where: {
            timestamp: { gte: startDate, lte: endDate }
          }
        }),
        prisma.pageView.count({
          where: {
            timestamp: { gte: startDate, lte: endDate }
          }
        }),
        prisma.event.findMany({
          where: {
            timestamp: { gte: startDate, lte: endDate },
            userId: { not: null }
          },
          select: { userId: true },
          distinct: ['userId']
        }),
        prisma.pageView.findMany({
          where: {
            timestamp: { gte: startDate, lte: endDate }
          },
          select: { sessionId: true },
          distinct: ['sessionId']
        })
      ]);

      return {
        totalEvents,
        totalPageViews,
        uniqueUsers: uniqueUsers.length,
        uniqueSessions: uniqueSessions.length
      };
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      throw error;
    }
  }
}
