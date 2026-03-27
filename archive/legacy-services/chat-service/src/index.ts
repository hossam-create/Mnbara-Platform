import express, { Application } from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import chatRoutes from './routes/chat.routes';
import { SocketService } from './services/socket.service';
import { logger } from './utils/logger';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3016;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Initialize Socket.IO
const socketService = new SocketService(httpServer);

// Routes
app.use('/chat', chatRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Chat Service',
    version: '1.0.0',
    status: 'running',
    features: ['Real-time messaging', 'Socket.IO', 'Direct & Group chat'],
    endpoints: {
      createConversation: 'POST /chat/conversations',
      getConversations: 'GET /chat/conversations',
      getMessages: 'GET /chat/conversations/:id/messages',
      getUnreadCount: 'GET /chat/conversations/:id/unread',
    },
    socket: {
      events: [
        'message:send',
        'message:edit',
        'message:delete',
        'message:react',
        'message:read',
        'typing:start',
        'typing:stop',
      ],
    },
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
httpServer.listen(PORT, () => {
  logger.info(`🚀 Chat Service running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔌 Socket.IO enabled`);
});

export default app;
