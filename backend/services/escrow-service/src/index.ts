// Escrow Service - Main Entry Point
// Traditional Escrow inspired by Smart Contract logic

import express, { Application } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import escrowRoutes from './routes/escrow.routes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3011;

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
app.use('/api/v1/escrow', escrowRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Escrow Service',
    version: '1.0.0',
    description: 'Traditional Escrow inspired by Smart Contract',
    status: 'running',
    endpoints: {
      health: '/api/v1/escrow/health',
      create: 'POST /api/v1/escrow',
      get: 'GET /api/v1/escrow/:id',
      status: 'GET /api/v1/escrow/:id/status',
      signature: 'POST /api/v1/escrow/:id/signature',
      lock: 'POST /api/v1/escrow/:id/lock',
      release: 'POST /api/v1/escrow/:id/release',
      dispute: 'POST /api/v1/escrow/:id/dispute',
      resolve: 'POST /api/v1/escrow/:id/resolve'
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Escrow Service running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`💼 Inspired by: SmartContractEscrowSystem`);
});

export default app;
