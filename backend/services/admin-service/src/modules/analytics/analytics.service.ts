import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly db: DatabaseService) {}

  async getOverview(period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get active users (users who logged in during period)
    const activeUsersResult = await this.db.query(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM user_sessions 
       WHERE login_at >= $1`,
      [startDate]
    );

    // Get total orders during period
    const ordersResult = await this.db.query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE created_at >= $1`,
      [startDate]
    );

    // Get revenue during period
    const revenueResult = await this.db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue 
       FROM orders 
       WHERE created_at >= $1 AND status = 'COMPLETED'`,
      [startDate]
    );

    // Calculate average order value
    const avgOrderValue = ordersResult.rows[0].count > 0
      ? parseFloat(revenueResult.rows[0].revenue) / parseInt(ordersResult.rows[0].count)
      : 0;

    return {
      period,
      activeUsers: parseInt(activeUsersResult.rows[0].count),
      totalOrders: parseInt(ordersResult.rows[0].count),
      revenue: parseFloat(revenueResult.rows[0].revenue),
      avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
      trends: {
        users: '+12%', // TODO: Calculate real trend
        orders: '+8%',
        revenue: '+15%',
      },
    };
  }

  async getUserAnalytics(period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total users
    const totalUsersResult = await this.db.query(
      'SELECT COUNT(*) as count FROM users'
    );

    // New users in period
    const newUsersResult = await this.db.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= $1',
      [startDate]
    );

    // Active users
    const activeUsersResult = await this.db.query(
      `SELECT COUNT(DISTINCT user_id) as count 
       FROM user_sessions 
       WHERE login_at >= $1`,
      [startDate]
    );

    // Users by country
    const byCountryResult = await this.db.query(
      `SELECT last_login_country as country, COUNT(*) as count 
       FROM users 
       WHERE last_login_country IS NOT NULL 
       GROUP BY last_login_country 
       ORDER BY count DESC 
       LIMIT 5`
    );

    // Users by device (from recent sessions)
    const byDeviceResult = await this.db.query(
      `SELECT device_type as device, COUNT(DISTINCT user_id) as count 
       FROM user_sessions 
       WHERE login_at >= $1 
       GROUP BY device_type`,
      [startDate]
    );

    return {
      period,
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      newUsers: parseInt(newUsersResult.rows[0].count),
      activeUsers: parseInt(activeUsersResult.rows[0].count),
      retentionRate: 68.5, // TODO: Calculate real retention
      byCountry: byCountryResult.rows.map(row => ({
        country: row.country || 'Unknown',
        count: parseInt(row.count),
      })),
      byDevice: byDeviceResult.rows.map(row => ({
        device: row.device || 'Unknown',
        count: parseInt(row.count),
      })),
    };
  }

  async getOrderAnalytics(period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total orders
    const totalOrdersResult = await this.db.query(
      'SELECT COUNT(*) as count FROM orders WHERE created_at >= $1',
      [startDate]
    );

    // Orders by status
    const byStatusResult = await this.db.query(
      `SELECT status, COUNT(*) as count 
       FROM orders 
       WHERE created_at >= $1 
       GROUP BY status`,
      [startDate]
    );

    const statusCounts = byStatusResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);

    const completedOrders = statusCounts['COMPLETED'] || 0;
    const totalOrders = parseInt(totalOrdersResult.rows[0].count);
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

    return {
      period,
      totalOrders,
      completedOrders,
      pendingOrders: statusCounts['PENDING'] || 0,
      cancelledOrders: statusCounts['CANCELLED'] || 0,
      completionRate: parseFloat(completionRate.toFixed(1)),
      avgDeliveryTime: 12.5, // TODO: Calculate from tracking_events
      byStatus: byStatusResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
      })),
    };
  }

  async getRevenueAnalytics(period: string) {
    const days = this.parsePeriod(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Total revenue
    const revenueResult = await this.db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as revenue 
       FROM orders 
       WHERE created_at >= $1 AND status = 'COMPLETED'`,
      [startDate]
    );

    const totalRevenue = parseFloat(revenueResult.rows[0].revenue);
    const commission = totalRevenue * 0.15; // 15% commission

    // Escrow held
    const escrowResult = await this.db.query(
      `SELECT COALESCE(SUM(amount), 0) as held 
       FROM escrow_transactions 
       WHERE status = 'HELD'`
    );

    // Revenue by category (if categories exist in orders)
    const byCategoryResult = await this.db.query(
      `SELECT 
        COALESCE(product_type, 'Other') as category,
        COALESCE(SUM(total_amount), 0) as revenue 
       FROM orders 
       WHERE created_at >= $1 AND status = 'COMPLETED' 
       GROUP BY product_type 
       ORDER BY revenue DESC 
       LIMIT 5`,
      [startDate]
    );

    // Daily revenue for last 7 days
    const dailyRevenueResult = await this.db.query(
      `SELECT 
        DATE(created_at) as date,
        COALESCE(SUM(total_amount), 0) as revenue 
       FROM orders 
       WHERE created_at >= NOW() - INTERVAL '7 days' 
         AND status = 'COMPLETED' 
       GROUP BY DATE(created_at) 
       ORDER BY date DESC 
       LIMIT 7`
    );

    return {
      period,
      totalRevenue,
      commission,
      escrowHeld: parseFloat(escrowResult.rows[0].held),
      byCategory: byCategoryResult.rows.map(row => ({
        category: row.category,
        revenue: parseFloat(row.revenue),
      })),
      dailyRevenue: dailyRevenueResult.rows.map(row => ({
        date: row.date,
        revenue: parseFloat(row.revenue),
      })),
    };
  }

  private parsePeriod(period: string): number {
    const match = period.match(/^(\d+)([dDmMyY])$/);
    if (!match) return 7; // default to 7 days

    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();

    switch (unit) {
      case 'd': return value;
      case 'm': return value * 30;
      case 'y': return value * 365;
      default: return 7;
    }
  }
}

