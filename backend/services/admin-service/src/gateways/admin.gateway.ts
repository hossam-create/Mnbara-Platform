import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DatabaseService } from '../database/database.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients = new Map<string, Socket>();

  constructor(private db: DatabaseService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);
    
    // Send initial stats
    this.sendRealtimeStats(client);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  @SubscribeMessage('subscribe:stats')
  handleSubscribeStats(client: Socket) {
    // Start sending real-time stats every 5 seconds
    const interval = setInterval(async () => {
      if (!this.connectedClients.has(client.id)) {
        clearInterval(interval);
        return;
      }
      await this.sendRealtimeStats(client);
    }, 5000);
  }

  private async sendRealtimeStats(client: Socket) {
    try {
      // Get active users count
      const activeUsersResult = await this.db.query(
        `SELECT COUNT(DISTINCT user_id) as count 
         FROM user_sessions 
         WHERE is_active = true`
      );

      // Get recent orders count (last hour)
      const recentOrdersResult = await this.db.query(
        `SELECT COUNT(*) as count 
         FROM orders 
         WHERE created_at >= NOW() - INTERVAL '1 hour'`
      );

      // Get recent activities
      const recentActivitiesResult = await this.db.query(
        `SELECT 
          ua.action_type,
          ua.created_at,
          u.first_name,
          u.last_name
         FROM user_activity_logs ua
         JOIN users u ON ua.user_id = u.id
         ORDER BY ua.created_at DESC
         LIMIT 10`
      );

      client.emit('stats:update', {
        activeUsers: parseInt(activeUsersResult.rows[0].count),
        recentOrders: parseInt(recentOrdersResult.rows[0].count),
        recentActivities: recentActivitiesResult.rows,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending real-time stats:', error);
    }
  }

  // Broadcast new order to all connected clients
  async broadcastNewOrder(orderId: number) {
    const orderResult = await this.db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length > 0) {
      this.server.emit('order:new', orderResult.rows[0]);
    }
  }

  // Broadcast new user registration
  async broadcastNewUser(userId: number) {
    const userResult = await this.db.query(
      'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length > 0) {
      this.server.emit('user:new', userResult.rows[0]);
    }
  }

  // Broadcast KYC verification update
  broadcastKYCUpdate(userId: number, status: string) {
    this.server.emit('kyc:update', {
      userId,
      status,
      timestamp: new Date().toISOString(),
    });
  }
}
