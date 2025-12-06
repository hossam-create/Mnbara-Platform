import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { SearchService } from '../search/search.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly db: DatabaseService,
    private readonly searchService: SearchService,
  ) {}

  async getAllUsers(filters: any) {
    const { page = 1, limit = 20, role, kycStatus } = filters;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (role) {
      conditions.push(`role = $${paramIndex++}`);
      values.push(role);
    }

    if (kycStatus !== undefined) {
      const isVerified = kycStatus === 'true' || kycStatus === true;
      conditions.push(`kyc_verified = $${paramIndex++}`);
      values.push(isVerified);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM users ${whereClause}`;
    const countResult = await this.db.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get users with pagination
    const usersQuery = `
      SELECT 
        id, email, first_name, last_name, role, kyc_verified,
        last_login_at, last_login_country, 
        COALESCE((SELECT device_type FROM user_sessions WHERE user_id = users.id ORDER BY login_at DESC LIMIT 1), 'Unknown') as last_login_device,
        created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;
    
    const usersResult = await this.db.query(usersQuery, [...values, limit, offset]);

    // Get order stats for each user
    const usersWithStats = await Promise.all(
      usersResult.rows.map(async (user) => {
        const orderStats = await this.db.query(
          `SELECT 
            COUNT(*) as total_orders,
            COALESCE(SUM(total_amount), 0) as total_spent
           FROM orders 
           WHERE buyer_id = $1`,
          [user.id]
        );

        return {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          kycVerified: user.kyc_verified,
          lastLogin: user.last_login_at,
          lastLoginCountry: user.last_login_country,
          lastLoginDevice: user.last_login_device,
          totalOrders: parseInt(orderStats.rows[0].total_orders),
          totalSpent: parseFloat(orderStats.rows[0].total_spent),
        };
      })
    );

    return {
      data: usersWithStats,
      total,
      page,
      limit,
    };
  }

  async getUserById(id: number) {
    // Get user details
    const userResult = await this.db.query(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return null;
    }

    const user = userResult.rows[0];

    // Get order stats
    const orderStatsResult = await this.db.query(
      `SELECT 
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_orders,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_orders,
        COALESCE(SUM(total_amount), 0) as total_spent,
        COALESCE(AVG(total_amount), 0) as avg_order_value
       FROM orders 
       WHERE buyer_id = $1`,
      [id]
    );

    const stats = orderStatsResult.rows[0];

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      kycVerified: user.kyc_verified,
      kycVerifiedAt: user.kyc_verified_at,
      rating: parseFloat(user.rating) || 0,
      createdAt: user.created_at,
      lastLogin: user.last_login_at,
      lastLoginCountry: user.last_login_country,
      lastLoginCity: null, // TODO: Add city tracking
      lastLoginDevice: user.last_login_device,
      totalLoginCount: user.total_login_count || 0,
      stats: {
        totalOrders: parseInt(stats.total_orders),
        completedOrders: parseInt(stats.completed_orders),
        cancelledOrders: parseInt(stats.cancelled_orders),
        totalSpent: parseFloat(stats.total_spent),
        avgOrderValue: parseFloat(stats.avg_order_value),
      },
    };
  }

  async getUserSessions(userId: number) {
    const sessionsResult = await this.db.query(
      `SELECT * FROM user_sessions 
       WHERE user_id = $1 
       ORDER BY login_at DESC 
       LIMIT 100`,
      [userId]
    );

    const totalResult = await this.db.query(
      `SELECT COUNT(*) as count FROM user_sessions WHERE user_id = $1`,
      [userId]
    );

    return {
      userId,
      sessions: sessionsResult.rows.map(session => ({
        id: session.id,
        deviceType: session.device_type,
        deviceInfo: session.device_info,
        ipAddress: session.ip_address,
        country: session.country,
        city: session.city,
        loginAt: session.login_at,
        logoutAt: session.logout_at,
        sessionDuration: session.session_duration,
        isActive: session.is_active,
      })),
      total: parseInt(totalResult.rows[0].count),
    };
  }

  async getUserActivity(userId: number) {
    const activitiesResult = await this.db.query(
      `SELECT * FROM user_activity_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 100`,
      [userId]
    );

    const totalResult = await this.db.query(
      `SELECT COUNT(*) as count FROM user_activity_logs WHERE user_id = $1`,
      [userId]
    );

    return {
      userId,
      activities: activitiesResult.rows.map(activity => ({
        id: activity.id,
        actionType: activity.action_type,
        resourceType: activity.resource_type,
        resourceId: activity.resource_id,
        metadata: activity.metadata,
        createdAt: activity.created_at,
      })),
      total: parseInt(totalResult.rows[0].count),
    };
  }
}

