/**
 * Smart Buyer AI Assistant Service
 * Camera/Mic powered product search and matching
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import aiBuyerRoutes from './routes/ai-buyer.routes';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3025;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'ai-buyer-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    capabilities: ['camera-integration', 'voice-recognition', 'image-recognition', 'product-matching', 'smart-search']
  });
});

// API routes
app.use('/api/ai-buyer', aiBuyerRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Smart Buyer AI Assistant',
    version: '1.0.0',
    description: 'Camera/Mic powered product search and matching',
    endpoints: {
      health: 'GET /health',
      camera: 'POST /api/ai-buyer/camera/upload',
      gallery: 'POST /api/ai-buyer/gallery/upload',
      voice: 'POST /api/ai-buyer/voice/process',
      search: 'POST /api/ai-buyer/search',
      match: 'POST /api/ai-buyer/match',
      suggestions: 'GET /api/ai-buyer/suggestions/:query'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Endpoint ${req.method} ${req.path} does not exist` });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error(`[ERROR] ${err.message}`, err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`Smart Buyer AI Service running on port ${PORT}`);
  });
}

export default app;
