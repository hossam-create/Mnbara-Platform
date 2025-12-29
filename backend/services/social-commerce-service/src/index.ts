import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

// Import routes
import teamPurchaseRoutes from './routes/teamPurchase.routes';
import liveStreamRoutes from './routes/liveStream.routes';
import influencerRoutes from './routes/influencer.routes';
import socialShareRoutes from './routes/socialShare.routes';

const app = express();
const httpServer = createServer(app);

// Socket.IO for real-time live stream updates
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'social-commerce-service',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/team-purchase', teamPurchaseRoutes);
app.use('/api/v1/live-stream', liveStreamRoutes);
app.use('/api/v1/influencer', influencerRoutes);
app.use('/api/v1/social-share', socialShareRoutes);

// Socket.IO events for live streaming
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  socket.on('join-stream', (streamId: string) => {
    socket.join(`stream:${streamId}`);
    io.to(`stream:${streamId}`).emit('viewer-joined', { viewerId: socket.id });
  });

  socket.on('leave-stream', (streamId: string) => {
    socket.leave(`stream:${streamId}`);
    io.to(`stream:${streamId}`).emit('viewer-left', { viewerId: socket.id });
  });

  socket.on('live-purchase', (data: { streamId: string; productId: string; userId: string }) => {
    io.to(`stream:${data.streamId}`).emit('purchase-notification', {
      message: 'تم شراء منتج جديد! 🎉',
      productId: data.productId,
    });
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Export io for use in controllers
export { io };

const PORT = process.env.PORT || 3028;

httpServer.listen(PORT, () => {
  console.log(`🚀 Social Commerce Service running on port ${PORT}`);
  console.log(`📡 WebSocket ready for live streaming`);
});

export default app;
