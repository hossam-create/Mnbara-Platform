// AI Pricing Service Entry Point
// Mnbara E-commerce Platform

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import routes from './routes/ai-pricing.routes';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 3040;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} [${duration}ms]`);
  });
  
  next();
});

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/ai-pricing/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'ai-pricing-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.use('/api/ai-pricing', routes);

// API documentation endpoint
app.get('/api/ai-pricing', (req: Request, res: Response) => {
  res.json({
    service: 'AI Pricing Service',
    version: '1.0.0',
    description: 'Predictive AI & Dynamic Pricing Engine for Mnbara Platform',
    endpoints: {
      predictive: {
        'POST /api/ai-pricing/predictive/profile': 'Build user behavior profile',
        'GET /api/ai-pricing/predictive/predictions/:userId': 'Get user predictions',
        'POST /api/ai-pricing/predictive/needs': 'Predict user purchase needs',
        'GET /api/ai-pricing/predictive/suggestions/:userId': 'Get proactive suggestions',
        'POST /api/ai-pricing/predictive/timing': 'Optimize purchase timing',
      },
      pricing: {
        'POST /api/ai-pricing/pricing/optimize': 'Optimize product price',
        'POST /api/ai-pricing/pricing/batch-optimize': 'Batch optimize prices',
        'POST /api/ai-pricing/pricing/competitive': 'Get competitive price suggestion',
        'POST /api/ai-pricing/pricing/rules/apply': 'Apply pricing rules',
        'GET /api/ai-pricing/pricing/optimizations/:productId': 'Get optimizations',
      },
      market: {
        'GET /api/ai-pricing/market/overview': 'Get market overview',
        'GET /api/ai-pricing/market/trends': 'Get market trends',
        'GET /api/ai-pricing/market/direction': 'Get market direction',
        'GET /api/ai-pricing/market/price-index': 'Get price index history',
        'GET /api/ai-pricing/market/price-compare/:categoryId': 'Compare category prices',
        'POST /api/ai-pricing/market/forecast': 'Generate demand forecast',
        'GET /api/ai-pricing/market/insights': 'Get active insights',
        'POST /api/ai-pricing/market/insights/generate': 'Generate insights',
        'GET /api/ai-pricing/market/price-history/:productId': 'Get price history',
      },
    },
    documentation: '/api/ai-pricing/health',
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           AI Pricing Service - Starting Up                  ║
╠════════════════════════════════════════════════════════════╣
║  Service:    AI Pricing & Predictive Buying Engine          ║
║  Version:    1.0.0                                          ║
║  Port:       ${PORT}                                            ║
║  Environment: ${process.env.NODE_ENV || 'development'}                             ║
║  Health:     http://localhost:${PORT}/api/ai-pricing/health      ║
║  API Docs:   http://localhost:${PORT}/api/ai-pricing              ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

export default app;
