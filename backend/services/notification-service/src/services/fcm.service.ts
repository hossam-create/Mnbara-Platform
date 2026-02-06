/**
 * Firebase Cloud Messaging (FCM) Service
 * Handles push notification delivery with templates and delivery tracking
 */

import admin from 'firebase-admin';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { NotificationType, Priority, NotificationJobData } from '../types/notification.types';

const prisma = new PrismaClient();

interface FCMConfig {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
}

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  actionUrl?: string;
  priority?: 'high' | 'normal';
  channelId?: string;
  notificationId?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class FCMService {
  private initialized = false;
  private defaultChannelId = 'mnbara_notifications';

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Firebase Admin SDK
   */
  private initialize(): void {
    try {
      const config: FCMConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

      if (config.projectId && config.clientEmail && config.privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: config.projectId,
            clientEmail: config.clientEmail,
            privateKey: config.privateKey,
          }),
        });

        this.initialized = true;
        logger.info('FCM Service initialized successfully');
      } else {
        // Try using service account JSON string
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
          });
          this.initialized = true;
          logger.info('FCM Service initialized with service account JSON');
        } else {
          logger.warn('FCM not initialized - missing credentials');
        }
      }
    } catch (error) {
      logger.error('Failed to initialize FCM:', error);
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(token: string, payload: PushPayload): Promise<SendResult> {
    if (!this.initialized) {
      return { success: false, error: 'FCM not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority || 'normal',
          notification: {
            channelId: payload.channelId || this.defaultChannelId,
            clickAction: payload.actionUrl,
            notificationId: payload.notificationId,
          },
        },
        apns: {
          payload: {
            aps: {
              'mutable-content': 1,
              'content-available': payload.priority === 'high' ? 1 : undefined,
            },
          },
          fcmOptions: {
            imageUrl: payload.imageUrl,
          },
        },
        webpush: payload.actionUrl ? {
          fcmOptions: {
            link: payload.actionUrl,
          },
          headers: {
            imageUrl: payload.imageUrl || '',
          },
        } : undefined,
      };

      const response = await admin.messaging().send(message);
      
      logger.info(`FCM push sent to device: ${response}`);
      return { success: true, messageId: response };
    } catch (error: any) {
      logger.error('FCM send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToDevices(tokens: string[], payload: PushPayload): Promise<{
    success: boolean;
    successCount: number;
    failureCount: number;
    errors?: string[];
  }> {
    if (!this.initialized) {
      return { success: false, successCount: 0, failureCount: tokens.length, errors: ['FCM not initialized'] };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority || 'normal',
          notification: {
            channelId: payload.channelId || this.defaultChannelId,
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      logger.info(`FCM bulk push sent: ${response.successCount}/${tokens.length}`);
      
      return {
        success: true,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error: any) {
      logger.error('FCM bulk send error:', error);
      return { success: false, successCount: 0, failureCount: tokens.length, errors: [error.message] };
    }
  }

  /**
   * Send push notification to a topic
   */
  async sendToTopic(topic: string, payload: PushPayload): Promise<SendResult> {
    if (!this.initialized) {
      return { success: false, error: 'FCM not initialized' };
    }

    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          imageUrl: payload.imageUrl,
        },
        data: payload.data || {},
        android: {
          priority: payload.priority || 'normal',
          notification: {
            channelId: payload.channelId || this.defaultChannelId,
          },
        },
      };

      const response = await admin.messaging().send(message);
      
      logger.info(`FCM topic push sent to ${topic}: ${response}`);
      return { success: true, messageId: response };
    } catch (error: any) {
      logger.error('FCM topic send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Subscribe devices to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('FCM not initialized');
    }

    await admin.messaging().subscribeToTopic(tokens, topic);
    logger.info(`Subscribed ${tokens.length} tokens to topic: ${topic}`);
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('FCM not initialized');
    }

    await admin.messaging().unsubscribeFromTopic(tokens, topic);
    logger.info(`Unsubscribed ${tokens.length} tokens from topic: ${topic}`);
  }

  /**
   * Send notification using template
   */
  async sendTemplatedNotification(
    userId: string,
    templateName: string,
    data: Record<string, any>,
    tokens: string[]
  ): Promise<SendResult> {
    // Get template
    const template = await prisma.notificationTemplate.findUnique({
      where: { name: templateName },
    });

    if (!template) {
      return { success: false, error: `Template ${templateName} not found` };
    }

    // Render template content
    const title = this.renderTemplate(template.title || '', data);
    const body = this.renderTemplate(template.template, data);

    return await this.sendToDevices(tokens, {
      title,
      body,
      data: this.flattenData(data),
      imageUrl: template.data?.imageUrl as string || undefined,
      actionUrl: template.data?.actionUrl as string || undefined,
    });
  }

  /**
   * Render template string with Handlebars-like syntax
   */
  private renderTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }

  /**
   * Flatten nested data for FCM
   */
  private flattenData(data: Record<string, any>, prefix = ''): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(data)) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenData(value, newKey));
      } else {
        result[newKey] = String(value);
      }
    }
    
    return result;
  }

  /**
   * Process notification job from queue
   */
  async processNotificationJob(jobData: NotificationJobData): Promise<boolean> {
    // Get user's device tokens
    const deviceTokens = await prisma.deviceToken.findMany({
      where: {
        userId: jobData.userId,
        isActive: true,
        provider: 'FCM',
      },
      select: { token: true },
    });

    if (deviceTokens.length === 0) {
      logger.debug(`No active device tokens for user ${jobData.userId}`);
      return false;
    }

    const tokens = deviceTokens.map(t => t.token);
    const priority: 'high' | 'normal' = 
      jobData.priority === 'HIGH' || jobData.priority === 'URGENT' ? 'high' : 'normal';

    const result = await this.sendToDevices(tokens, {
      title: jobData.title || '',
      body: jobData.content,
      data: jobData.data as Record<string, string> || {},
      priority,
    });

    // Log delivery
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId: jobData.notificationId,
        event: result.success ? 'SENT' : 'FAILED',
        metadata: {
          successCount: result.successCount,
          failureCount: result.failureCount,
          errors: result.errors,
        },
      },
    });

    return result.success;
  }

  /**
   * Get delivery statistics for a user
   */
  async getDeliveryStats(userId: string, days: number = 30): Promise<{
    total: number;
    sent: number;
    delivered: number;
    failed: number;
    rate: number;
  }> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [total, sent, delivered, failed] = await Promise.all([
      prisma.notification.count({
        where: {
          userId,
          channel: 'PUSH',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          channel: 'PUSH',
          status: 'SENT',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          channel: 'PUSH',
          status: 'DELIVERED',
          createdAt: { gte: startDate },
        },
      }),
      prisma.notification.count({
        where: {
          userId,
          channel: 'PUSH',
          status: 'FAILED',
          createdAt: { gte: startDate },
        },
      }),
    ]);

    return {
      total,
      sent,
      delivered,
      failed,
      rate: total > 0 ? (delivered / total) * 100 : 0,
    };
  }

  /**
   * Handle FCM error responses and cleanup invalid tokens
   */
  async handleSendError(tokens: string[], error: any): Promise<string[]> {
    const invalidTokens: string[] = [];

    if (error.code === 'messaging/invalid-registration-token') {
      invalidTokens.push(...tokens);
    } else if (error.code === 'messaging/registration-token-not-registered') {
      invalidTokens.push(...tokens);
    } else if (error.results) {
      // Batch response with individual errors
      error.results.forEach((result: any, index: number) => {
        if (result.error) {
          const errorCode = result.error.code;
          if (errorCode === 'messaging/invalid-registration-token' || 
              errorCode === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[index]);
          }
        }
      });
    }

    // Mark invalid tokens as inactive
    if (invalidTokens.length > 0) {
      await prisma.deviceToken.updateMany({
        where: {
          token: { in: invalidTokens },
        },
        data: { isActive: false },
      });
      logger.info(`Marked ${invalidTokens.length} tokens as inactive`);
    }

    return invalidTokens;
  }
}

// Export singleton instance
export const fcmService = new FCMService();
