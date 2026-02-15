import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Routes
import uiConfigRoutes from './routes/ui-config.routes';
import sectionsRoutes from './routes/sections.routes';
import itemsRoutes from './routes/items.routes';
import bannersRoutes from './routes/banners.routes';
import themesRoutes from './routes/themes.routes';
import versionsRoutes from './routes/versions.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Middleware
import { errorHandler } from './middleware/error-handler';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3020;

// ==========================================
// MIDDLEWARE
// ==========================================

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Parsing & Compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());

// Logging
app.use(morgan('combined'));

// ==========================================
// HEALTH CHECK
// ==========================================

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      service: 'ui-config-service',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'ui-config-service',
      error: 'Database connection failed'
    });
  }
});

// ==========================================
// PUBLIC ROUTES (For Mobile App)
// ==========================================

// Main endpoint for Flutter app to fetch UI configuration
app.use('/api/v1/ui-config', uiConfigRoutes);

// ==========================================
// PROTECTED ROUTES (For Dashboard)
// ==========================================

// Dashboard routes require authentication
app.use('/api/v1/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/v1/sections', authMiddleware, sectionsRoutes);
app.use('/api/v1/items', authMiddleware, itemsRoutes);
app.use('/api/v1/banners', authMiddleware, bannersRoutes);
app.use('/api/v1/themes', authMiddleware, themesRoutes);
app.use('/api/v1/versions', authMiddleware, versionsRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// ==========================================
// START SERVER
// ==========================================

const startServer = async () => {
  try {
    // Connect to database
    await prisma.$connect();
    console.log('✅ Database connected');

    // Start server
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🎨 Mnbara UI Config Service                              ║
║   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   ║
║                                                            ║
║   Server running on port ${PORT}                            ║
║                                                            ║
║   Endpoints:                                               ║
║   • GET  /health              - Health check               ║
║   • GET  /api/v1/ui-config    - Get UI config (public)     ║
║   • POST /api/v1/sections     - Create section (auth)      ║
║   • PUT  /api/v1/sections/:id - Update section (auth)      ║
║   • DELETE /api/v1/sections/:id - Delete section (auth)    ║
║   • POST /api/v1/items        - Create item (auth)         ║
║   • PUT  /api/v1/items/:id    - Update item (auth)         ║
║   • POST /api/v1/sections/reorder - Reorder sections       ║
║                                                            ║
║   Dashboard: /api/v1/dashboard                             ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export { app, prisma };
