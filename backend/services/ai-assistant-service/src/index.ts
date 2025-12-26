import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import chatRoutes from './routes/chat.routes';
import recommendationRoutes from './routes/recommendation.routes';
import sentimentRoutes from './routes/sentiment.routes';
import fraudRoutes from './routes/fraud.routes';
import forecastRoutes from './routes/forecast.routes';
import priceRoutes from './routes/price.routes';

const app: Express = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3024;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy', 
    service: 'ai-assistant-service',
    version: 'Gen 10',
    capabilities: [
      'Intelligent Chat Assistant',
      'Personalized Recommendations',
      'Sentiment Analysis',
      'Fraud Detection',
      'Demand Forecasting',
      'Price Optimization',
      'Multi-language Support (50+ languages)',
      'Real-time Processing'
    ],
    languages: ['ar', 'en', 'fr', 'de', 'es', 'zh', 'ja', 'ko', 'hi', 'tr'],
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/sentiment', sentimentRoutes);
app.use('/api/v1/fraud', fraudRoutes);
app.use('/api/v1/forecast', forecastRoutes);
app.use('/api/v1/price', priceRoutes);

// WebSocket for real-time chat
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join_conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
  });

  socket.on('send_message', async (data: { conversationId: string; message: string; userId: string }) => {
    // Process message with AI
    io.to(data.conversationId).emit('message_received', {
      role: 'user',
      content: data.message,
      timestamp: new Date()
    });

    // AI response will be sent via the chat service
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    messageAr: 'المسار غير موجود'
  });
});

// Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    messageAr: 'خطأ في الخادم'
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🧠 AI Assistant Service (Gen 10) running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Supporting 50+ languages`);
  console.log(`⚡ Real-time WebSocket enabled`);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

export { app, io, prisma };
