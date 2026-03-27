import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { SubscriptionController } from './controllers/SubscriptionController';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import { rateLimiter } from './middleware/rateLimiter';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3025;
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Subscription Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Initialize controller
const subscriptionController = new SubscriptionController();

// Public routes
app.get('/plans', subscriptionController.getAllPlans);
app.get('/features', subscriptionController.getAllFeatures);

// Protected routes
app.use(authMiddleware);

// Subscription management
app.get('/subscriptions', subscriptionController.getUserSubscription);
app.post('/subscriptions', subscriptionController.createSubscription);
app.put('/subscriptions/:id', subscriptionController.updateSubscription);
app.delete('/subscriptions/:id', subscriptionController.cancelSubscription);

// Feature access
app.post('/check-access', subscriptionController.checkFeatureAccess);
app.post('/feature-usage', subscriptionController.recordFeatureUsage);

// Admin routes (require admin role)
app.get('/admin/subscriptions', subscriptionController.getAllSubscriptions);
app.get('/admin/feature-usage', subscriptionController.getFeatureUsageStats);
app.put('/admin/features/:featureName/toggle', subscriptionController.toggleFeatureLock);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;