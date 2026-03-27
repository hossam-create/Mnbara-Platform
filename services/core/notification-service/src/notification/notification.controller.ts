import {
  Controller, Get, Post, Put, Delete, Body, Param, Query, Headers,
  HttpCode, HttpStatus, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create and send a notification' })
  async createNotification(@Body() body: any, @Headers('x-user-id') headerUserId?: string) {
    const userId = headerUserId || body.userId;
    if (!userId) throw new BadRequestException('userId is required');
    if (!body.type || !body.channel || !body.content) throw new BadRequestException('type, channel, and content are required');

    const notification = await this.notificationService.createNotification({
      userId, type: body.type, channel: body.channel, recipient: body.recipient,
      title: body.title, subject: body.subject, content: body.content, data: body.data,
      priority: body.priority,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    return { success: true, data: notification };
  }

  @Post('templated')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send notification using a template' })
  async sendTemplatedNotification(@Body() body: any, @Headers('x-user-id') headerUserId?: string) {
    const userId = headerUserId || body.userId;
    if (!userId) throw new BadRequestException('userId is required');
    if (!body.templateName || !body.channel) throw new BadRequestException('templateName and channel are required');

    const notification = await this.notificationService.sendTemplatedNotification({
      userId, templateName: body.templateName, data: body.data || {},
      channel: body.channel, priority: body.priority,
      scheduledFor: body.scheduledFor ? new Date(body.scheduledFor) : undefined,
    });

    return { success: true, data: notification };
  }

  @Get('unread/count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Query('userId') userId: string, @Headers('x-user-id') headerUserId?: string) {
    const uid = headerUserId || userId;
    if (!uid) throw new BadRequestException('userId is required');
    const count = await this.notificationService.getUnreadCount(uid);
    return { success: true, data: { unreadCount: count } };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get delivery statistics' })
  async getDeliveryStats(@Query('userId') userId: string, @Headers('x-user-id') headerUserId?: string) {
    const uid = headerUserId || userId;
    if (!uid) throw new BadRequestException('userId is required');
    const stats = await this.notificationService.getDeliveryStats(uid);
    return { success: true, data: stats };
  }

  @Post('auction')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send auction notification' })
  async sendAuctionNotification(@Body() body: any) {
    if (!body.type || !body.auctionId || !body.auctionTitle || !body.userId) {
      throw new BadRequestException('type, auctionId, auctionTitle, and userId are required');
    }
    await this.notificationService.sendAuctionNotification(body.type, body.auctionId, body.auctionTitle, body.userId, body.data || {});
    return { success: true, message: 'Auction notification queued' };
  }

  @Post('order')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send order notification' })
  async sendOrderNotification(@Body() body: any) {
    if (!body.type || !body.orderId || !body.userId) throw new BadRequestException('type, orderId, and userId are required');
    await this.notificationService.sendOrderNotification(body.type, body.orderId, body.userId, body.orderDetails || {});
    return { success: true, message: 'Order notification queued' };
  }

  @Post('payment')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send payment notification' })
  async sendPaymentNotification(@Body() body: any) {
    if (!body.type || !body.transactionId || !body.amount || !body.currency || !body.userId) {
      throw new BadRequestException('type, transactionId, amount, currency, and userId are required');
    }
    await this.notificationService.sendPaymentNotification(body.type, body.transactionId, body.amount, body.currency, body.userId, body.details || {});
    return { success: true, message: 'Payment notification queued' };
  }

  @Post('chat')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Send chat notification' })
  async sendChatNotification(@Body() body: any) {
    if (!body.conversationId || !body.senderId || !body.recipientId || !body.messageId) {
      throw new BadRequestException('conversationId, senderId, recipientId, and messageId are required');
    }
    await this.notificationService.sendChatNotification(
      body.conversationId, body.senderId, body.senderName || 'Someone',
      body.recipientId, body.messagePreview || '', body.messageId,
    );
    return { success: true, message: 'Chat notification queued' };
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'unreadOnly', required: false })
  async getNotifications(
    @Query('userId') userId: string, @Query('page') page?: string,
    @Query('limit') limit?: string, @Query('unreadOnly') unreadOnly?: string,
    @Headers('x-user-id') headerUserId?: string,
  ) {
    const uid = headerUserId || userId;
    if (!uid) throw new BadRequestException('userId is required');
    const result = await this.notificationService.getUserNotifications(
      uid, parseInt(page || '1'), parseInt(limit || '20'), unreadOnly === 'true',
    );
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  async getNotification(@Param('id') id: string) {
    const notification = await this.notificationService.getNotification(id);
    if (!notification) throw new NotFoundException('Notification not found');
    return { success: true, data: notification };
  }

  @Put('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@Body() body: any, @Headers('x-user-id') headerUserId?: string) {
    const userId = headerUserId || body.userId;
    if (!userId) throw new BadRequestException('userId is required');
    const count = await this.notificationService.markAllAsRead(userId);
    return { success: true, data: { markedAsRead: count } };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@Param('id') id: string) {
    const notification = await this.notificationService.markAsRead(id);
    return { success: true, data: notification };
  }

  @Get(':id/delivery')
  @ApiOperation({ summary: 'Get delivery status' })
  async getDeliveryStatus(@Param('id') id: string) {
    const status = await this.notificationService.getDeliveryStatus(id);
    return { success: true, data: status };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(@Param('id') id: string) {
    await this.notificationService.deleteNotification(id);
    return { success: true, message: 'Notification deleted' };
  }
}
