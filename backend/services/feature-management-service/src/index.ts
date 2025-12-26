// Feature Management Service - Feature Flags & Release Management
// خدمة إدارة الميزات - أعلام الميزات وإدارة الإصدارات

import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Routes
import featureRoutes from './routes/feature.routes';
import releaseRoutes from './routes/release.routes';
import configRoutes from './routes/config.routes';

const app: Express = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3028;

// Socket.IO for real-time feature updates
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health Check
app.get('/health', async (_req: Request, res: Response) => {
  const dbStatus = await prisma.$queryRaw`SELECT 1`.then(() => 'connected').catch(() => 'disconnected');
  
  res.json({
    status: 'healthy',
    service: 'feature-management-service',
    version: '1.0.0',
    name: 'Mnbara Feature Management',
    nameAr: 'منبرة لإدارة الميزات',
    description: 'Feature Flags & Release Management System',
    descriptionAr: 'نظام أعلام الميزات وإدارة الإصدارات',
    database: dbStatus,
    features: [
      'Feature Flags',
      'Gradual Rollout',
      'User/Region Overrides',
      'Release Management',
      'Real-time Updates',
      'Metrics & Analytics',
      'Dependency Management'
    ],
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/v1/features', featureRoutes);
app.use('/api/v1/releases', releaseRoutes);
app.use('/api/v1/config', configRoutes);

// Socket.IO Events
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  socket.on('subscribe:features', () => {
    socket.join('feature-updates');
  });
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in services
export { io };

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    messageAr: 'المسار غير موجود'
  });
});

// Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    messageAr: 'خطأ في الخادم'
  });
});

// Start Server
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   🚀 Mnbara Feature Management - منبرة لإدارة الميزات        ║
║                                                              ║
║   "Control Your Features with Confidence"                    ║
║   "تحكم في ميزاتك بثقة"                                      ║
║                                                              ║
║   🌐 Port: ${PORT}                                             ║
║   🎚️  Feature Flags: Enabled                                 ║
║   📊 Metrics: Real-time                                      ║
║   🔄 Rollout: Gradual                                        ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down Feature Management Service...');
  await prisma.$disconnect();
  process.exit(0);
});

export { app, prisma };
