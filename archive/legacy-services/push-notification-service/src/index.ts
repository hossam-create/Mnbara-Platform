import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import notificationRoutes from './routes/notification.routes';
import { logger } from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3015;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/notifications', notificationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Push Notification Service',
    version: '1.0.0',
    status: 'running',
    providers: ['FCM', 'OneSignal'],
    endpoints: {
      registerDevice: 'POST /notifications/devices/register',
      unregisterDevice: 'POST /notifications/devices/unregister',
      sendNotification: 'POST /notifications/send',
      sendBulk: 'POST /notifications/send/bulk',
      sendToTopic: 'POST /notifications/send/topic',
      sendToSegment: 'POST /notifications/send/segment',
      getHistory: 'GET /notifications/history/:userId',
      getStats: 'GET /notifications/stats/:userId',
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
app.listen(PORT, () => {
  logger.info(`🚀 Push Notification Service running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
