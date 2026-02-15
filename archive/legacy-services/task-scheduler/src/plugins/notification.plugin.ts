// Notification Plugin - Send notifications for auctions, orders, etc.
import { Plugin, ExecutionContext, PluginResult } from '../types/task.types';
import axios from 'axios';

export class NotificationPlugin implements Plugin {
  name = 'notification';
  description = 'Send notifications to users (auction alerts, order updates, etc.)';

  async execute(params: any, context: ExecutionContext): Promise<PluginResult> {
    try {
      context.logger.info('Starting notification plugin');

      // Check for auction ending soon
      if (params.checkAuctions) {
        await this.checkAuctionEndingSoon(params, context);
      }

      // Check for order updates
      if (params.checkOrders) {
        await this.checkOrderUpdates(params, context);
      }

      // Send custom notification
      if (params.message && params.userId) {
        await this.sendNotification(params.userId, params.message, context);
      }

      return {
        success: true,
        data: { sent: true }
      };

    } catch (error: any) {
      context.logger.error(`Notification plugin failed: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private async checkAuctionEndingSoon(params: any, context: ExecutionContext) {
    const alertBefore = params.alertBefore || 5; // minutes
    context.logger.info(`Checking auctions ending in ${alertBefore} minutes`);

    try {
      // Call auction service to get ending auctions
      const auctionServiceUrl = process.env.AUCTION_SERVICE_URL || 'http://localhost:3002';
      const response = await axios.get(`${auctionServiceUrl}/api/v1/auctions/ending-soon`, {
        params: { minutes: alertBefore }
      });

      const auctions = response.data.data || [];
      context.logger.info(`Found ${auctions.length} auctions ending soon`);

      // Send notification for each auction
      for (const auction of auctions) {
        await this.sendAuctionAlert(auction, context);
      }

    } catch (error: any) {
      context.logger.warn(`Failed to check auctions: ${error.message}`);
    }
  }

  private async checkOrderUpdates(params: any, context: ExecutionContext) {
    context.logger.info('Checking for order updates');
    // Implementation for order notifications
  }

  private async sendAuctionAlert(auction: any, context: ExecutionContext) {
    context.logger.info(`Sending auction alert for: ${auction.id}`);

    try {
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001';
      
      await axios.post(`${notificationServiceUrl}/api/v1/notifications`, {
        userId: auction.sellerId,
        type: 'auction_ending_soon',
        title: 'Auction Ending Soon',
        message: `Your auction "${auction.title}" is ending in 5 minutes!`,
        data: { auctionId: auction.id }
      });

      context.logger.info(`Auction alert sent for: ${auction.id}`);
    } catch (error: any) {
      context.logger.error(`Failed to send auction alert: ${error.message}`);
    }
  }

  private async sendNotification(userId: string, message: string, context: ExecutionContext) {
    context.logger.info(`Sending notification to user: ${userId}`);

    try {
      const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3001';
      
      await axios.post(`${notificationServiceUrl}/api/v1/notifications`, {
        userId,
        type: 'custom',
        message
      });

      context.logger.info(`Notification sent to: ${userId}`);
    } catch (error: any) {
      context.logger.error(`Failed to send notification: ${error.message}`);
    }
  }
}
