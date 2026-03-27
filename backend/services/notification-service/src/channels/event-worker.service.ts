import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailChannelService } from './email.service';
import { SmsChannelService } from './sms.service';
import { FcmChannelService } from './fcm.service';

@Injectable()
export class EventWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventWorkerService.name);
  private redis: any = null;
  private subscriber: any = null;
  private publisher: any = null;
  private notificationQueue: any = null;
  private retryQueue: any = null;
  private notificationWorker: any = null;
  private retryWorker: any = null;

  private readonly CHANNELS = {
    AUCTION: 'mnbara:events:auction', BID: 'mnbara:events:bid',
    ORDER: 'mnbara:events:order', PAYMENT: 'mnbara:events:payment',
    CHAT: 'mnbara:events:chat', USER: 'mnbara:events:user', SYSTEM: 'mnbara:events:system',
  };

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly emailService: EmailChannelService,
    private readonly smsService: SmsChannelService,
    private readonly fcmService: FcmChannelService,
  ) {}

  async onModuleInit() {
    await this.initialize();
  }

  async onModuleDestroy() {
    await this.close();
  }

  async initialize(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (!redisUrl) {
        this.logger.warn('Redis not configured - event worker running in degraded mode');
        return;
      }

      const Redis = require('ioredis');
      const { Queue, Worker, QueueEvents } = require('bullmq');

      const url = new URL(redisUrl);
      const config = { host: url.hostname, port: parseInt(url.port), password: url.password || undefined };

      this.redis = new Redis(config);
      this.subscriber = this.redis.duplicate();
      this.publisher = this.redis.duplicate();

      this.notificationQueue = new Queue('notifications', {
        connection: this.redis,
        defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 }, removeOnComplete: 100, removeOnFail: 1000 },
      });

      this.retryQueue = new Queue('notification-retries', {
        connection: this.redis,
        defaultJobOptions: { attempts: 5, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 50, removeOnFail: 500 },
      });

      this.notificationWorker = new Worker('notifications', async (job: any) => {
        await this.processNotification(job);
      }, { connection: this.redis, concurrency: 10 });

      this.retryWorker = new Worker('notification-retries', async (job: any) => {
        await this.processRetry(job);
      }, { connection: this.redis, concurrency: 5 });

      const notifEvents = new QueueEvents('notifications', { connection: this.redis });
      notifEvents.on('completed', ({ jobId }: any) => this.logger.debug(`Job ${jobId} completed`));
      notifEvents.on('failed', ({ jobId, failedReason }: any) => {
        this.logger.error(`Job ${jobId} failed: ${failedReason}`);
        this.scheduleRetry(jobId, failedReason);
      });

      await this.subscribeToChannels();

      this.logger.log('Event Worker Service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize Event Worker Service:', error);
    }
  }

  private async processNotification(job: any): Promise<void> {
    const { notificationId, type, channel, userId, recipient, content, title, data } = job.data;
    this.logger.log(`Processing notification ${notificationId} (${type}/${channel})`);

    try {
      await this.prisma.notification.update({ where: { id: notificationId }, data: { status: 'SENDING' } });

      let success = false;
      switch (channel) {
        case 'EMAIL': success = !!(await this.emailService.sendEmail(recipient, title || '', content, undefined, data)); break;
        case 'SMS': success = !!(await this.smsService.sendSMS(recipient, content)); break;
        case 'PUSH': success = await this.fcmService.processNotificationJob(userId, title || '', content, data, job.data.priority); break;
        case 'IN_APP':
          await this.prisma.notification.create({
            data: { userId, type: 'SYSTEM_ALERT', channel: 'IN_APP', title, content, data, status: 'SENT' },
          });
          success = true;
          break;
      }

      if (success) {
        await this.prisma.notification.update({
          where: { id: notificationId },
          data: { status: 'SENT', sentAt: new Date(), providerId: `provider_${Date.now()}` },
        });
        await this.prisma.notificationDeliveryLog.create({ data: { notificationId, event: 'SENT' } });
      } else {
        throw new Error('Failed to send notification');
      }
    } catch (error: any) {
      this.logger.error(`Failed to process notification ${notificationId}:`, error);
      throw error;
    }
  }

  private async processRetry(job: any): Promise<void> {
    const { notificationId, retryCount } = job.data;
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) return;

    if (notification.retryCount >= notification.maxRetries) {
      await this.prisma.notification.update({ where: { id: notificationId }, data: { status: 'FAILED' } });
      return;
    }

    await this.enqueueNotification({
      notificationId: notification.id, type: notification.type, channel: notification.channel,
      userId: notification.userId, recipient: notification.recipient, content: notification.content,
      title: notification.title || undefined, data: notification.data as any,
      priority: notification.priority, retryCount: retryCount + 1,
    });
    await this.prisma.notification.update({ where: { id: notificationId }, data: { retryCount: { increment: 1 } } });
  }

  private async scheduleRetry(jobId: string, reason: string): Promise<void> {
    if (!this.retryQueue) return;
    await this.retryQueue.add('retry', { notificationId: jobId, error: reason, retryCount: 1 });
  }

  async enqueueNotification(data: any): Promise<void> {
    if (!this.notificationQueue) {
      this.logger.warn('Queue not available - notification not enqueued');
      return;
    }

    const priorityValue: Record<string, number> = { LOW: 10, NORMAL: 5, HIGH: 2, URGENT: 1 };
    await this.notificationQueue.add('process', data, { priority: priorityValue[data.priority] || 5 });
    await this.prisma.notification.update({ where: { id: data.notificationId }, data: { status: 'QUEUED' } });
  }

  async publishEvent(channel: string, event: any): Promise<void> {
    if (!this.publisher) return;
    await this.publisher.publish(channel, JSON.stringify({ ...event, timestamp: new Date(), source: 'notification-service' }));
  }

  private async subscribeToChannels(): Promise<void> {
    if (!this.subscriber) return;
    const channels = Object.values(this.CHANNELS);
    await this.subscriber.subscribe(...channels);
    this.subscriber.on('message', (channel: string, message: string) => this.handleChannelMessage(channel, message));
    this.logger.log(`Subscribed to ${channels.length} event channels`);
  }

  private async handleChannelMessage(channel: string, message: string): Promise<void> {
    try {
      const event = JSON.parse(message);
      switch (event.event) {
        case 'NEW_BID': case 'OUTBID': case 'AUCTION_ENDING_SOON':
          for (const userId of event.data?.users || []) {
            await this.enqueueNotification({
              notificationId: `notif_${Date.now()}_${userId}`,
              type: event.event === 'NEW_BID' ? 'NEW_BID_RECEIVED' : event.event,
              channel: 'PUSH', userId, recipient: userId,
              content: `Auction update: ${event.event}`, title: 'Auction Update',
              data: event.data, priority: event.event === 'AUCTION_ENDING_SOON' ? 'HIGH' : 'NORMAL', retryCount: 0,
            });
          }
          break;
        case 'ORDER_CREATED': case 'ORDER_SHIPPED': case 'ORDER_DELIVERED':
          await this.enqueueNotification({
            notificationId: `notif_${Date.now()}_${event.data.userId}`,
            type: `ORDER_${event.data.status.toUpperCase()}`, channel: 'PUSH',
            userId: event.data.userId, recipient: event.data.userId,
            content: `Order ${event.data.orderId}: ${event.data.status}`, title: 'Order Update',
            data: event.data, priority: 'NORMAL', retryCount: 0,
          });
          break;
        case 'PAYMENT_RECEIVED': case 'PAYMENT_FAILED':
          await this.enqueueNotification({
            notificationId: `notif_${Date.now()}_${event.data.userId}`,
            type: event.event, channel: 'PUSH',
            userId: event.data.userId, recipient: event.data.userId,
            content: `Payment ${event.data.status}: ${event.data.amount} ${event.data.currency}`, title: 'Payment Update',
            data: event.data, priority: 'HIGH', retryCount: 0,
          });
          break;
        case 'MESSAGE_SENT':
          await this.enqueueNotification({
            notificationId: `notif_${Date.now()}_${event.data.recipientId}`,
            type: 'NEW_MESSAGE', channel: 'PUSH',
            userId: event.data.recipientId, recipient: event.data.recipientId,
            content: event.data.content?.substring(0, 100) || '', title: 'New Message',
            data: event.data, priority: 'NORMAL', retryCount: 0,
          });
          break;
      }
    } catch (error) {
      this.logger.error('Error handling channel message:', error);
    }
  }

  async getQueueStats(): Promise<any> {
    if (!this.notificationQueue || !this.retryQueue) return { notifications: {}, retries: {} };
    const [n, r] = await Promise.all([this.notificationQueue.getJobCounts(), this.retryQueue.getJobCounts()]);
    return {
      notifications: { waiting: n?.waiting || 0, active: n?.active || 0, completed: n?.completed || 0, failed: n?.failed || 0 },
      retries: { waiting: r?.waiting || 0, active: r?.active || 0, completed: r?.completed || 0, failed: r?.failed || 0 },
    };
  }

  async close(): Promise<void> {
    if (this.notificationWorker) await this.notificationWorker.close();
    if (this.retryWorker) await this.retryWorker.close();
    if (this.notificationQueue) await this.notificationQueue.close();
    if (this.retryQueue) await this.retryQueue.close();
    if (this.redis) await this.redis.quit();
    if (this.subscriber) await this.subscriber.quit();
    if (this.publisher) await this.publisher.quit();
    this.logger.log('Event Worker Service closed');
  }
}
