/**
 * Notification Service Entry Point
 * Integrates HTTP server, WebSocket, and event workers
 */

import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import notificationRoutes from './routes/notification.routes';
import webhookRoutes from './routes/webhook.routes';
import { logger } from './utils/logger';
import { websocketService } from './services/websocket.service';
import { eventWorkerService } from './services/event-worker.service';
import { notificationService } from './services/notification.service';
import { NOTIFICATION_TEMPLATES } from './templates/notification-templates';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3013;
const prisma = new PrismaClient();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'notification-service',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/notifications', notificationRoutes);
app.use('/webhooks', webhookRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Notification Service',
    version: '1.0.0',
    description: 'Complete notification system with WebSocket, push, email, SMS, and delivery tracking',
    endpoints: {
      notifications: '/notifications',
      webhooks: '/webhooks',
      health: '/health',
    },
    features: [
      'Real-time WebSocket notifications',
      'Push notifications (FCM)',
      'Email notifications (SendGrid)',
      'SMS notifications (Twilio)',
      'In-app notifications',
      'Event-driven architecture',
      'Retry logic with exponential backoff',
      'Delivery tracking',
      'Notification templates',
      'Scheduled notifications',
    ],
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

/**
 * Initialize all services
 */
async function initializeServices(): Promise<void> {
  try {
    // Seed notification templates
    await seedTemplates();
    logger.info('Templates seeded');

    // Initialize WebSocket service
    await websocketService.initialize(httpServer, PORT);
    logger.info('WebSocket service initialized');

    // Initialize event worker service
    await eventWorkerService.initialize();
    logger.info('Event worker service initialized');

    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    throw error;
  }
}

/**
 * Seed notification templates to database
 */
async function seedTemplates(): Promise<void> {
  for (const template of NOTIFICATION_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: { name: template.name },
      create: {
        name: template.name,
        type: template.type,
        channel: template.channel,
        title: template.title,
        subject: template.subject,
        template: template.template,
        variables: JSON.stringify(template.variables),
      },
      update: {
        type: template.type,
        channel: template.channel,
        title: template.title,
        subject: template.subject,
        template: template.template,
        variables: JSON.stringify(template.variables),
      },
    });
  }
}

// Initialize and start server
initializeServices()
  .then(() => {
    httpServer.listen(PORT, () => {
      logger.info(`🚀 Notification Service running on port ${PORT}`);
      logger.info(`📝 WebSocket server ready for real-time notifications`);
      logger.info(`🔔 Push notifications enabled`);
      logger.info(`📧 Email notifications ready`);
      logger.info(`💬 SMS notifications ready`);
    });
  })
  .catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await websocketService.close();
  await eventWorkerService.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await websocketService.close();
  await eventWorkerService.close();
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
