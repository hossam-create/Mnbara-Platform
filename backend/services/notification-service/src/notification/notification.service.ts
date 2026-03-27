import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventWorkerService } from '../channels/event-worker.service';
import { WebsocketChannelService } from '../channels/websocket.service';
import {
  NotificationType, NotificationChannel, NotificationStatus, Priority,
  CreateNotificationDto, NotificationResponse, NotificationListResponse,
  SendTemplatedNotificationDto,
} from '../types/notification.types';
import Handlebars from 'handlebars';

const templateCache = new Map<string, { title?: string; subject?: string; template: string }>();

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventWorker: EventWorkerService,
    private readonly websocket: WebsocketChannelService,
  ) {}

  async createNotification(dto: CreateNotificationDto): Promise<NotificationResponse> {
    const { userId, type, channel, recipient, title, subject, content, data, priority, scheduledFor, expiresAt } = dto;

    const notification = await this.prisma.notification.create({
      data: {
        userId, type, channel, recipient: recipient || userId,
        title, subject, content, data,
        status: scheduledFor ? 'PENDING' : 'QUEUED',
        priority: priority || 'NORMAL', scheduledFor, expiresAt,
      },
    });

    this.logger.log(`Created notification ${notification.id} (${type}/${channel})`);

    if (scheduledFor) return this.toResponse(notification);

    await this.eventWorker.enqueueNotification({
      notificationId: notification.id, type, channel, userId,
      recipient: notification.recipient, content, title, data,
      priority: priority || 'NORMAL', retryCount: 0,
    });

    return this.toResponse(notification);
  }

  async sendTemplatedNotification(dto: SendTemplatedNotificationDto): Promise<NotificationResponse> {
    const { userId, templateName, data, channel, priority, scheduledFor } = dto;

    const template = await this.getTemplate(templateName);
    if (!template) throw new NotFoundException(`Template ${templateName} not found`);

    const compiledTitle = template.title ? Handlebars.compile(template.title)(data) : undefined;
    const compiledSubject = template.subject ? Handlebars.compile(template.subject)(data) : undefined;
    const compiledContent = Handlebars.compile(template.template)(data);

    return this.createNotification({
      userId, type: template.type, channel,
      title: compiledTitle, subject: compiledSubject, content: compiledContent,
      data, priority, scheduledFor,
    });
  }

  async getUserNotifications(userId: string, page = 1, limit = 20, unreadOnly = false): Promise<NotificationListResponse> {
    const where: any = { userId };
    if (unreadOnly) where.status = { not: 'READ' };

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications: notifications.map((n: any) => this.toResponse(n)), total, page, limit };
  }

  async getNotification(notificationId: string): Promise<NotificationResponse | null> {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    return notification ? this.toResponse(notification) : null;
  }

  async markAsRead(notificationId: string): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.update({
      where: { id: notificationId }, data: { status: 'READ', readAt: new Date() },
    });
    await this.prisma.notificationDeliveryLog.create({ data: { notificationId, event: 'READ' } });
    return this.toResponse(notification);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { userId, status: { not: 'READ' } }, data: { status: 'READ', readAt: new Date() },
    });
    return result.count;
  }

  async deleteNotification(notificationId: string): Promise<boolean> {
    await this.prisma.notification.delete({ where: { id: notificationId } });
    return true;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({ where: { userId, status: { not: 'READ' } } });
  }

  async getDeliveryStatus(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new NotFoundException('Notification not found');

    const logs = await this.prisma.notificationDeliveryLog.findMany({
      where: { notificationId }, orderBy: { timestamp: 'asc' }, select: { event: true, timestamp: true },
    });

    return {
      status: notification.status as NotificationStatus,
      sentAt: notification.sentAt || undefined,
      deliveredAt: notification.deliveredAt || undefined,
      logs: logs.map((l: any) => ({ event: l.event, timestamp: l.timestamp })),
    };
  }

  async sendAuctionNotification(type: string, auctionId: string, auctionTitle: string, userId: string, data: Record<string, any>): Promise<void> {
    const templateMap: Record<string, string> = {
      AUCTION_ENDING_SOON: 'auction-ending-soon', NEW_BID_RECEIVED: 'new-bid-received',
      OUTBID: 'outbid', AUCTION_WON: 'auction-won', AUCTION_LOST: 'auction-lost',
    };
    const templateName = templateMap[type];
    const priority: Priority = type === 'AUCTION_ENDING_SOON' ? 'HIGH' : 'NORMAL';

    await Promise.all([
      this.sendTemplatedNotification({ userId, templateName, data: { auctionTitle, ...data }, channel: 'PUSH' as any, priority }),
      this.sendTemplatedNotification({ userId, templateName, data: { auctionTitle, ...data }, channel: 'IN_APP' as any, priority }),
    ]);

    await this.websocket.sendToUser(userId, { type: 'auction', data: { type, auctionId, auctionTitle, ...data }, timestamp: new Date() });
  }

  async sendOrderNotification(type: string, orderId: string, userId: string, orderDetails: Record<string, any>): Promise<void> {
    const templateMap: Record<string, string> = {
      ORDER_CONFIRMED: 'order-confirmed', ORDER_SHIPPED: 'order-shipped',
      ORDER_DELIVERED: 'order-delivered', ORDER_CANCELLED: 'order-cancelled',
    };
    await this.sendTemplatedNotification({ userId, templateName: templateMap[type], data: { orderId, ...orderDetails }, channel: 'PUSH' as any });
    await this.websocket.sendToUser(userId, { type: 'order', data: { type, orderId, ...orderDetails }, timestamp: new Date() });
  }

  async sendPaymentNotification(type: string, transactionId: string, amount: number, currency: string, userId: string, details: Record<string, any>): Promise<void> {
    const templateMap: Record<string, string> = {
      PAYMENT_RECEIVED: 'payment-received', PAYMENT_FAILED: 'payment-failed', REFUND_ISSUED: 'refund-issued',
    };
    await this.sendTemplatedNotification({
      userId, templateName: templateMap[type],
      data: { transactionId, amount, currency, ...details }, channel: 'PUSH' as any,
      priority: type === 'PAYMENT_FAILED' ? 'HIGH' : 'NORMAL',
    });
    await this.websocket.sendToUser(userId, { type: 'payment', data: { type, transactionId, amount, currency, ...details }, timestamp: new Date() });
  }

  async sendChatNotification(conversationId: string, senderId: string, senderName: string, recipientId: string, messagePreview: string, messageId: string): Promise<void> {
    await this.sendTemplatedNotification({
      userId: recipientId, templateName: 'new-message',
      data: { senderName, conversationId, messagePreview, senderId, messageId }, channel: 'PUSH' as any,
    });
    await this.websocket.sendToUser(recipientId, {
      type: 'message', data: { type: 'NEW_MESSAGE', conversationId, senderId, senderName, preview: messagePreview, messageId }, timestamp: new Date(),
    });
  }

  async getDeliveryStats(userId: string) {
    const [total, sent, delivered, failed, read] = await Promise.all([
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, status: 'SENT' } }),
      this.prisma.notification.count({ where: { userId, status: 'DELIVERED' } }),
      this.prisma.notification.count({ where: { userId, status: 'FAILED' } }),
      this.prisma.notification.count({ where: { userId, status: 'READ' } }),
    ]);
    return {
      total, sent, delivered, failed, read,
      deliveryRate: sent > 0 ? (delivered / sent) * 100 : 0,
      readRate: delivered > 0 ? (read / delivered) * 100 : 0,
    };
  }

  async createTemplate(name: string, type: string, channel: string, title: string | null, subject: string | null, template: string, variables?: string[]) {
    await this.prisma.notificationTemplate.create({
      data: { name, type, channel, title, subject, template, variables: variables ? JSON.stringify(variables) : null },
    });
    templateCache.delete(name);
  }

  private async getTemplate(name: string): Promise<{ type: any; title?: string; subject?: string; template: string } | null> {
    if (templateCache.has(name)) return templateCache.get(name) as any;
    const template = await this.prisma.notificationTemplate.findUnique({ where: { name } });
    if (template) {
      const cached = { type: template.type, title: template.title || undefined, subject: template.subject || undefined, template: template.template };
      templateCache.set(name, cached);
      return cached;
    }
    return null;
  }

  private toResponse(notification: any): NotificationResponse {
    return {
      id: notification.id, type: notification.type, channel: notification.channel,
      title: notification.title, subject: notification.subject, content: notification.content,
      status: notification.status, priority: notification.priority, data: notification.data,
      createdAt: notification.createdAt, sentAt: notification.sentAt,
      deliveredAt: notification.deliveredAt, readAt: notification.readAt,
    };
  }
}
