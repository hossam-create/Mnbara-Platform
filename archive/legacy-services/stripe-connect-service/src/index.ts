/**
 * Stripe Connect Service Entry Point
 */

import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import stripeConnectRoutes from './routes/stripe-connect.routes';
import { logger } from './utils/logger';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3012;

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
app.use('/connect', stripeConnectRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    service: 'stripe-connect-service',
    version: '1.0.0',
    status: 'running',
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

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Stripe Connect Service running on port ${PORT}`);
});

export default app;
