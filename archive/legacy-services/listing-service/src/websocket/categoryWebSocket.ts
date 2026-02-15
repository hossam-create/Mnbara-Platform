import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { invalidateCategoryCache } from '../middleware/cache';

interface CategoryUpdateEvent {
  type: 'created' | 'updated' | 'deleted' | 'stats_updated';
  categoryId: string;
  category?: any;
  timestamp: number;
  userId?: string;
}

interface CategoryStatsUpdate {
  categoryId: string;
  stats: {
    productCount: number;
    activeListings: number;
    soldProducts: number;
    avgPrice: number;
    totalRevenue: number;
  };
}

class CategoryWebSocketService {
  private io: SocketIOServer;
  private connectedClients: Map<string, any> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        socket.data.user = decoded;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const userId = socket.data.user.id;
      this.connectedClients.set(userId, socket);

      console.log(`User ${userId} connected to category updates`);

      // Join category-specific rooms
      socket.on('join-category', (categoryId: string) => {
        socket.join(`category:${categoryId}`);
        console.log(`User ${userId} joined category ${categoryId}`);
      });

      socket.on('leave-category', (categoryId: string) => {
        socket.leave(`category:${categoryId}`);
        console.log(`User ${userId} left category ${categoryId}`);
      });

      // Join admin room for category management
      if (socket.data.user.role === 'admin') {
        socket.join('category-admin');
        console.log(`Admin ${userId} joined category admin room`);
      }

      // Handle real-time stats requests
      socket.on('request-category-stats', async (categoryId: string) => {
        try {
          // This would fetch real-time stats from database
          const stats = await this.getCategoryStats(categoryId);
          socket.emit('category-stats-updated', { categoryId, stats });
        } catch (error) {
          socket.emit('error', { message: 'Failed to fetch category stats' });
        }
      });

      socket.on('disconnect', () => {
        this.connectedClients.delete(userId);
        console.log(`User ${userId} disconnected from category updates`);
      });
    });
  }

  // Broadcast category updates to relevant clients
  broadcastCategoryUpdate(event: CategoryUpdateEvent): void {
    const { type, categoryId, category, timestamp, userId } = event;

    // Invalidate cache
    invalidateCategoryCache(categoryId);

    // Send to category-specific room
    this.io.to(`category:${categoryId}`).emit('category-updated', {
      type,
      categoryId,
      category,
      timestamp,
      userId
    });

    // Send to admin room
    this.io.to('category-admin').emit('category-admin-update', {
      type,
      categoryId,
      category,
      timestamp,
      userId
    });

    console.log(`Broadcasted category update: ${type} for category ${categoryId}`);
  }

  // Broadcast stats updates
  broadcastStatsUpdate(update: CategoryStatsUpdate): void {
    const { categoryId, stats } = update;

    this.io.to(`category:${categoryId}`).emit('category-stats-updated', {
      categoryId,
      stats,
      timestamp: Date.now()
    });

    this.io.to('category-admin').emit('category-stats-admin-update', {
      categoryId,
      stats,
      timestamp: Date.now()
    });
  }

  // Broadcast bulk operations
  broadcastBulkOperation(operation: {
    type: 'bulk_create' | 'bulk_update' | 'bulk_delete';
    categoryIds: string[];
    userId: string;
    results?: any;
  }): void {
    const { type, categoryIds, userId, results } = operation;

    // Invalidate cache for all affected categories
    categoryIds.forEach(id => invalidateCategoryCache(id));

    // Send to admin room
    this.io.to('category-admin').emit('category-bulk-operation', {
      type,
      categoryIds,
      userId,
      results,
      timestamp: Date.now()
    });

    // Send updates to individual category rooms
    categoryIds.forEach(categoryId => {
      this.io.to(`category:${categoryId}`).emit('category-bulk-update', {
        type,
        categoryId,
        results: results?.find(r => r.categoryId === categoryId),
        timestamp: Date.now()
      });
    });
  }

  // Send trending categories updates
  broadcastTrendingCategories(categories: any[]): void {
    this.io.emit('trending-categories-updated', {
      categories,
      timestamp: Date.now()
    });
  }

  // Send category tree updates
  broadcastTreeUpdate(): void {
    this.io.emit('category-tree-updated', {
      timestamp: Date.now()
    });
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any): void {
    const socket = this.connectedClients.get(userId);
    if (socket) {
      socket.emit(event, data);
    }
  }

  // Get room members
  async getRoomMembers(roomName: string): Promise<string[]> {
    const sockets = await this.io.in(roomName).fetchSockets();
    return sockets.map(socket => socket.data.user.id);
  }

  // Helper method to get category stats (would integrate with database)
  private async getCategoryStats(categoryId: string): Promise<any> {
    // This would integrate with your database service
    // For now, returning mock data
    return {
      productCount: Math.floor(Math.random() * 1000),
      activeListings: Math.floor(Math.random() * 500),
      soldProducts: Math.floor(Math.random() * 100),
      avgPrice: Math.random() * 1000,
      totalRevenue: Math.random() * 10000
    };
  }

  // Health check
  getHealthStatus(): any {
    return {
      connectedClients: this.connectedClients.size,
      rooms: this.io.sockets.adapter.rooms.size,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
let categoryWebSocketService: CategoryWebSocketService;

export const initializeCategoryWebSocket = (server: HTTPServer): CategoryWebSocketService => {
  if (!categoryWebSocketService) {
    categoryWebSocketService = new CategoryWebSocketService(server);
  }
  return categoryWebSocketService;
};

export const getCategoryWebSocketService = (): CategoryWebSocketService => {
  if (!categoryWebSocketService) {
    throw new Error('Category WebSocket service not initialized');
  }
  return categoryWebSocketService;
};

export default CategoryWebSocketService;
