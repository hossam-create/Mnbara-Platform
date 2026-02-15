import { Novu } from '@novu/node';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface TriggerNotificationInput {
  subscriberId: string;
  templateId: string;
  payload: Record<string, any>;
  overrides?: {
    email?: Record<string, any>;
    sms?: Record<string, any>;
    push?: Record<string, any>;
    inApp?: Record<string, any>;
  };
}

export interface CreateSubscriberInput {
  subscriberId: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  data?: Record<string, any>;
}

export class NovuService {
  private novu: Novu;

  constructor() {
    const apiKey = process.env.NOVU_API_KEY;
    if (!apiKey) {
      throw new Error('NOVU_API_KEY is required');
    }
    this.novu = new Novu(apiKey);
  }

  // Trigger notification
  async triggerNotification(input: TriggerNotificationInput) {
    try {
      const result = await this.novu.trigger(input.templateId, {
        to: {
          subscriberId: input.subscriberId
        },
        payload: input.payload,
        overrides: input.overrides
      });

      // Log to database
      await prisma.notification.create({
        data: {
          subscriberId: input.subscriberId,
          templateId: input.templateId,
          payload: input.payload,
          transactionId: result.data?.transactionId || '',
          status: 'sent'
        }
      });

      logger.info(`Notification triggered: ${input.templateId} for ${input.subscriberId}`);
      return result.data;
    } catch (error) {
      logger.error('Trigger notification error:', error);
      
      // Log failed notification
      await prisma.notification.create({
        data: {
          subscriberId: input.subscriberId,
          templateId: input.templateId,
          payload: input.payload,
          transactionId: '',
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      throw error;
    }
  }

  // Broadcast notification to all subscribers
  async broadcastNotification(templateId: string, payload: Record<string, any>) {
    try {
      const result = await this.novu.broadcast(templateId, {
        payload
      });

      logger.info(`Broadcast notification sent: ${templateId}`);
      return result.data;
    } catch (error) {
      logger.error('Broadcast notification error:', error);
      throw error;
    }
  }

  // Create or update subscriber
  async upsertSubscriber(input: CreateSubscriberInput) {
    try {
      const result = await this.novu.subscribers.identify(input.subscriberId, {
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        avatar: input.avatar,
        data: input.data
      });

      // Save to database
      await prisma.subscriber.upsert({
        where: { subscriberId: input.subscriberId },
        create: {
          subscriberId: input.subscriberId,
          email: input.email,
          phone: input.phone,
          firstName: input.firstName,
          lastName: input.lastName,
          data: input.data || {}
        },
        update: {
          email: input.email,
          phone: input.phone,
          firstName: input.firstName,
          lastName: input.lastName,
          data: input.data || {}
        }
      });

      logger.info(`Subscriber upserted: ${input.subscriberId}`);
      return result.data;
    } catch (error) {
      logger.error('Upsert subscriber error:', error);
      throw error;
    }
  }

  // Delete subscriber
  async deleteSubscriber(subscriberId: string) {
    try {
      await this.novu.subscribers.delete(subscriberId);

      await prisma.subscriber.delete({
        where: { subscriberId }
      });

      logger.info(`Subscriber deleted: ${subscriberId}`);
    } catch (error) {
      logger.error('Delete subscriber error:', error);
      throw error;
    }
  }

  // Update subscriber preferences
  async updatePreferences(subscriberId: string, templateId: string, channel: string, enabled: boolean) {
    try {
      await this.novu.subscribers.updatePreference(subscriberId, templateId, {
        channel: { type: channel as any, enabled }
      });

      logger.info(`Preferences updated for ${subscriberId}`);
    } catch (error) {
      logger.error('Update preferences error:', error);
      throw error;
    }
  }

  // Get subscriber preferences
  async getPreferences(subscriberId: string) {
    try {
      const result = await this.novu.subscribers.getPreference(subscriberId);
      return result.data;
    } catch (error) {
      logger.error('Get preferences error:', error);
      throw error;
    }
  }

  // Get notification feed
  async getNotificationFeed(subscriberId: string, page: number = 0) {
    try {
      const result = await this.novu.subscribers.getNotificationsFeed(subscriberId, {
        page
      });

      return result.data;
    } catch (error) {
      logger.error('Get notification feed error:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(subscriberId: string, messageId: string) {
    try {
      await this.novu.subscribers.markMessageAs(subscriberId, messageId, {
        seen: true,
        read: true
      });

      logger.info(`Notification marked as read: ${messageId}`);
    } catch (error) {
      logger.error('Mark as read error:', error);
      throw error;
    }
  }

  // Mark all as read
  async markAllAsRead(subscriberId: string) {
    try {
      await this.novu.subscribers.markAllMessagesAs(subscriberId, {
        read: true
      });

      logger.info(`All notifications marked as read for: ${subscriberId}`);
    } catch (error) {
      logger.error('Mark all as read error:', error);
      throw error;
    }
  }

  // Get unseen count
  async getUnseenCount(subscriberId: string) {
    try {
      const result = await this.novu.subscribers.getUnseenCount(subscriberId);
      return result.data;
    } catch (error) {
      logger.error('Get unseen count error:', error);
      throw error;
    }
  }

  // Cancel triggered notification
  async cancelNotification(transactionId: string) {
    try {
      await this.novu.events.cancel(transactionId);

      await prisma.notification.updateMany({
        where: { transactionId },
        data: { status: 'cancelled' }
      });

      logger.info(`Notification cancelled: ${transactionId}`);
    } catch (error) {
      logger.error('Cancel notification error:', error);
      throw error;
    }
  }

  // Get notification history
  async getNotificationHistory(subscriberId: string, page: number = 1, limit: number = 10) {
    try {
      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where: { subscriberId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.notification.count({ where: { subscriberId } })
      ]);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Get notification history error:', error);
      throw error;
    }
  }
}
