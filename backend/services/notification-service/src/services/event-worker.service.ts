/**
 * Event Worker Service with Redis Pub/Sub
 * Handles event processing, queue management, and retry logic
 */

import Redis from 'ioredis';
import { Job, Queue, QueueEvents, Worker } from 'bullmq';
import { logger } from '../utils/logger';
import { NotificationJobData, RetryJobData, PubSubMessage, NotificationType, NotificationChannel, Priority } from '../types/notification.types';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RedisConfig {
  host: string;
  port: number;
  password?: string;
}

export class EventWorkerService {
  private redis: Redis | null = null;
  private notificationQueue: Queue | null = null;
  private retryQueue: Queue | null = null;
  private notificationWorker: Worker | null = null;
  private retryWorker: Worker | null = null;
  private subscriber: Redis | null = null;
  private publisher: Redis | null = null;

  // Event channels
  private readonly CHANNELS = {
    AUCTION: 'mnbara:events:auction',
    BID: 'mnbara:events:bid',
    ORDER: 'mnbara:events:order',
    PAYMENT: 'mnbara:events:payment',
    CHAT: 'mnbara:events:chat',
    USER: 'mnbara:events:user',
    SYSTEM: 'mnbara:events:system',
  };

  constructor() {}

  /**
   * Initialize event worker service
   */
  async initialize(): Promise<void> {
    try {
      // Connect to Redis
      const config = this.getRedisConfig();
      this.redis = new Redis(config);
      this.subscriber = this.redis.duplicate();
      this.publisher = this.redis.duplicate();

      // Initialize queues
      await this.initializeQueues();

      // Initialize workers
      await this.initializeWorkers();

      // Subscribe to event channels
      await this.subscribeToChannels();

      logger.info('Event Worker Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Event Worker Service:', error);
      throw error;
    }
  }

  /**
   * Get Redis configuration
   */
  private getRedisConfig(): RedisConfig {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      const url = new URL(redisUrl);
      return {
        host: url.hostname,
        port: parseInt(url.port),
        password: url.password || undefined,
      };
    }
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
    };
  }

  /**
   * Initialize Bull queues
   */
  private async initializeQueues(): Promise<void> {
    // Notification queue
    this.notificationQueue = new Queue('notifications', {
      connection: this.redis!,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      },
    });

    // Retry queue for failed notifications
    this.retryQueue = new Queue('notification-retries', {
      connection: this.redis!,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 50,
        removeOnFail: 500,
      },
    });

    // Set up queue event listeners
    const notificationEvents = new QueueEvents('notifications', {
      connection: this.redis!,
    });

    notificationEvents.on('completed', ({ jobId }) => {
      logger.info(`Notification job ${jobId} completed`);
    });

    notificationEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Notification job ${jobId} failed: ${failedReason}`);
      this.scheduleRetry(jobId, failedReason);
    });

    logger.info('Queues initialized');
  }

  /**
   * Initialize workers
   */
  private async initializeWorkers(): Promise<void> {
    // Notification worker
    this.notificationWorker = new Worker(
      'notifications',
      async (job: Job<NotificationJobData>) => {
        await this.processNotification(job);
      },
      {
        connection: this.redis!,
        concurrency: 10,
      }
    );

    // Retry worker
    this.retryWorker = new Worker(
      'notification-retries',
      async (job: Job<RetryJobData>) => {
        await this.processRetry(job);
      },
      {
        connection: this.redis!,
        concurrency: 5,
      }
    );

    logger.info('Workers initialized');
  }

  /**
   * Process notification from queue
   */
  private async processNotification(job: Job<NotificationJobData>): Promise<void> {
    const { notificationId, type, channel, userId, recipient, content, title, data } = job.data;

    logger.info(`Processing notification ${notificationId} (${type}/${channel})`);

    try {
      // Update status to SENDING
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'SENDING' },
      });

      // Process based on channel
      let success = false;
      switch (channel) {
        case 'EMAIL':
          success = await this.sendEmail(recipient, title || '', content, data);
          break;
        case 'SMS':
          success = await this.sendSMS(recipient, content);
          break;
        case 'PUSH':
          success = await this.sendPush(userId, title || '', content, data);
          break;
        case 'IN_APP':
          success = await this.sendInApp(userId, title || '', content, data);
          break;
      }

      if (success) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            providerId: `provider_${Date.now()}`,
          },
        });

        // Log delivery
        await this.logDelivery(notificationId, 'SENT');
        logger.info(`Notification ${notificationId} sent successfully`);
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error: any) {
      logger.error(`Failed to process notification ${notificationId}:`, error);
      throw error;
    }
  }

  /**
   * Process retry for failed notification
   */
  private async processRetry(job: Job<RetryJobData>): Promise<void> {
    const { notificationId, retryCount } = job.data;

    logger.info(`Processing retry ${retryCount} for notification ${notificationId}`);

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      logger.error(`Notification ${notificationId} not found`);
      return;
    }

    if (notification.retryCount >= notification.maxRetries) {
      logger.error(`Notification ${notificationId} exceeded max retries`);
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: 'FAILED' },
      });
      return;
    }

    // Re-queue notification
    await this.enqueueNotification({
      notificationId: notification.id,
      type: notification.type as NotificationType,
      channel: notification.channel as NotificationChannel,
      userId: notification.userId,
      recipient: notification.recipient,
      content: notification.content,
      title: notification.title || undefined,
      data: notification.data as Record<string, any>,
      priority: notification.priority as Priority,
      retryCount: retryCount + 1,
    });

    await prisma.notification.update({
      where: { id: notificationId },
      data: { retryCount: { increment: 1 } },
    });
  }

  /**
   * Schedule retry for failed notification
   */
  private async scheduleRetry(jobId: string, reason: string): Promise<void> {
    if (!this.retryQueue) return;

    await this.retryQueue.add('retry', {
      notificationId: jobId,
      error: reason,
      retryCount: 1,
    });

    logger.info(`Scheduled retry for notification ${jobId}`);
  }

  /**
   * Enqueue notification for processing
   */
  async enqueueNotification(data: NotificationJobData): Promise<void> {
    if (!this.notificationQueue) {
      throw new Error('Notification queue not initialized');
    }

    const priorityValue = {
      LOW: 10,
      NORMAL: 5,
      HIGH: 2,
      URGENT: 1,
    };

    await this.notificationQueue.add('process', data, {
      priority: priorityValue[data.priority],
    });

    // Update status to QUEUED
    await prisma.notification.update({
      where: { id: data.notificationId },
      data: { status: 'QUEUED' },
    });

    logger.debug(`Notification ${data.notificationId} enqueued`);
  }

  /**
   * Send email notification
   */
  private async sendEmail(to: string, subject: string, content: string, data?: Record<string, any>): Promise<boolean> {
    // TODO: Integrate with SendGrid
    logger.info(`Sending email to ${to}: ${subject}`);
    return true;
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(to: string, content: string): Promise<boolean> {
    // TODO: Integrate with Twilio
    logger.info(`Sending SMS to ${to}: ${content}`);
    return true;
  }

  /**
   * Send push notification
   */
  private async sendPush(userId: string, title: string, content: string, data?: Record<string, any>): Promise<boolean> {
    // TODO: Integrate with FCM service
    logger.info(`Sending push to user ${userId}: ${title} - ${content}`);
    return true;
  }

  /**
   * Send in-app notification
   */
  private async sendInApp(userId: string, title: string, content: string, data?: Record<string, any>): Promise<boolean> {
    // Store in database for in-app delivery
    await prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM_ALERT',
        channel: 'IN_APP',
        title,
        content,
        data,
        status: 'SENT',
      },
    });
    return true;
  }

  /**
   * Log delivery event
   */
  private async logDelivery(notificationId: string, event: string, metadata?: Record<string, any>): Promise<void> {
    await prisma.notificationDeliveryLog.create({
      data: {
        notificationId,
        event,
        metadata,
      },
    });
  }

  /**
   * Subscribe to event channels
   */
  private async subscribeToChannels(): Promise<void> {
    if (!this.subscriber) return;

    const channels = Object.values(this.CHANNELS);
    
    await this.subscriber.subscribe(...channels);
    logger.info(`Subscribed to ${channels.length} event channels`);

    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleChannelMessage(channel, message);
    });
  }

  /**
   * Handle incoming channel message
   */
  private async handleChannelMessage(channel: string, message: string): Promise<void> {
    try {
      const event: PubSubMessage = JSON.parse(message);
      
      logger.debug(`Received event from ${channel}: ${event.event}`);

      // Process event and create notifications
      switch (event.event) {
        case 'NEW_BID':
        case 'OUTBID':
        case 'AUCTION_ENDING_SOON':
          await this.handleAuctionEvent(event);
          break;
        case 'ORDER_CREATED':
        case 'ORDER_SHIPPED':
        case 'ORDER_DELIVERED':
          await this.handleOrderEvent(event);
          break;
        case 'PAYMENT_RECEIVED':
        case 'PAYMENT_FAILED':
          await this.handlePaymentEvent(event);
          break;
        case 'MESSAGE_SENT':
          await this.handleChatEvent(event);
          break;
      }
    } catch (error) {
      logger.error('Error handling channel message:', error);
    }
  }

  /**
   * Handle auction events
   */
  private async handleAuctionEvent(event: PubSubMessage): Promise<void> {
    const data = event.data as any;
    
    for (const userId of data.users || []) {
      await this.enqueueNotification({
        notificationId: `notif_${Date.now()}_${userId}`,
        type: event.event === 'NEW_BID' ? 'NEW_BID_RECEIVED' : 
               event.event === 'OUTBID' ? 'OUTBID' : 'AUCTION_ENDING_SOON',
        channel: 'PUSH',
        userId,
        recipient: userId,
        content: `Auction update: ${event.event}`,
        title: 'Auction Update',
        data,
        priority: event.event === 'AUCTION_ENDING_SOON' ? 'HIGH' : 'NORMAL',
        retryCount: 0,
      });
    }
  }

  /**
   * Handle order events
   */
  private async handleOrderEvent(event: PubSubMessage): Promise<void> {
    const data = event.data;
    
    await this.enqueueNotification({
      notificationId: `notif_${Date.now()}_${data.userId}`,
      type: `ORDER_${data.status.toUpperCase()}` as NotificationType,
      channel: 'PUSH',
      userId: data.userId,
      recipient: data.userId,
      content: `Order ${data.orderId}: ${data.status}`,
      title: 'Order Update',
      data,
      priority: 'NORMAL',
      retryCount: 0,
    });
  }

  /**
   * Handle payment events
   */
  private async handlePaymentEvent(event: PubSubMessage): Promise<void> {
    const data = event.data;
    
    await this.enqueueNotification({
      notificationId: `notif_${Date.now()}_${data.userId}`,
      type: `PAYMENT_${data.status.toUpperCase().replace(' ', '_')}` as NotificationType,
      channel: 'PUSH',
      userId: data.userId,
      recipient: data.userId,
      content: `Payment ${data.status}: ${data.amount} ${data.currency}`,
      title: 'Payment Update',
      data,
      priority: 'HIGH',
      retryCount: 0,
    });
  }

  /**
   * Handle chat events
   */
  private async handleChatEvent(event: PubSubMessage): Promise<void> {
    const data = event.data;
    
    await this.enqueueNotification({
      notificationId: `notif_${Date.now()}_${data.recipientId}`,
      type: 'NEW_MESSAGE',
      channel: 'PUSH',
      userId: data.recipientId,
      recipient: data.recipientId,
      content: data.content.substring(0, 100),
      title: 'New Message',
      data,
      priority: 'NORMAL',
      retryCount: 0,
    });
  }

  /**
   * Publish event to channel
   */
  async publishEvent(channel: string, event: Omit<PubSubMessage, 'timestamp'>): Promise<void> {
    if (!this.publisher) return;

    const message: PubSubMessage = {
      ...event,
      timestamp: new Date(),
      source: 'notification-service',
    };

    await this.publisher.publish(channel, JSON.stringify(message));
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    notifications: { waiting: number; active: number; completed: number; failed: number };
    retries: { waiting: number; active: number; completed: number; failed: number };
  }> {
    const [notifStats, retryStats] = await Promise.all([
      this.notificationQueue?.getJobCounts(),
      this.retryQueue?.getJobCounts(),
    ]);

    return {
      notifications: {
        waiting: notifStats?.waiting || 0,
        active: notifStats?.active || 0,
        completed: notifStats?.completed || 0,
        failed: notifStats?.failed || 0,
      },
      retries: {
        waiting: retryStats?.waiting || 0,
        active: retryStats?.active || 0,
        completed: retryStats?.completed || 0,
        failed: retryStats?.failed || 0,
      },
    };
  }

  /**
   * Close service
   */
  async close(): Promise<void> {
    if (this.notificationWorker) {
      await this.notificationWorker.close();
    }
    if (this.retryWorker) {
      await this.retryWorker.close();
    }
    if (this.notificationQueue) {
      await this.notificationQueue.close();
    }
    if (this.retryQueue) {
      await this.retryQueue.close();
    }
    if (this.redis) {
      await this.redis.quit();
    }
    if (this.subscriber) {
      await this.subscriber.quit();
    }
    if (this.publisher) {
      await this.publisher.quit();
    }
    logger.info('Event Worker Service closed');
  }
}

// Export singleton instance
export const eventWorkerService = new EventWorkerService();
