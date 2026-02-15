// AI Recommendations Service - Main Entry Point

import express, { Application } from 'express';
import dotenv from 'dotenv';
import recommendationRoutes from './routes/recommendation.routes';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/v1/recommendations', recommendationRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'AI Recommendations Service',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/v1/recommendations/health',
      recommendations: '/api/v1/recommendations/:userId',
      batch: '/api/v1/recommendations/batch'
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
  logger.info(`🚀 AI Recommendations Service running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🤖 AI Provider: ${process.env.AI_PROVIDER || 'openai'}`);
});

export default app;
