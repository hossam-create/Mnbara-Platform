import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import expressWs from 'express-ws';
import pluginRoutes from './plugin-controller';
import healthRoutes from './routes/health.routes';
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';
import { PluginHealthMonitor } from './monitoring/PluginHealthMonitor';
import { createHealthMiddleware } from './middleware/health.middleware';

const app = express();
const wsInstance = expressWs(app);
const PORT = process.env.PORT || 3003;

// Initialize health monitoring
const healthMonitor = new PluginHealthMonitor();
const healthMiddleware = createHealthMiddleware(healthMonitor);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Plugin API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', pluginRoutes);
app.use('/api', healthRoutes);

// Set health monitor for health routes
import('./routes/health.routes').then(module => {
  module.setHealthMonitor(healthMonitor);
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Plugin API server running on port ${PORT}`);
  console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Helmet + CORS + Rate limiting enabled`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
});

export default app;