import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { SignalController } from './controllers/signal.controller';
import { Logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3007;
const logger = new Logger('Server');

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize controller
const signalController = new SignalController();

// READ-ONLY Routes
app.get('/health', signalController.healthCheck.bind(signalController));
app.get('/info', signalController.getServiceInfo.bind(signalController));
app.get('/thresholds', signalController.getThresholds.bind(signalController));
app.get('/signals/:corridor/:timeBucket', signalController.getSignals.bind(signalController));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { 
    error: err.message, 
    stack: err.stack,
    path: req.path 
  });
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'This is a read-only signal aggregation service',
    availableEndpoints: [
      'GET /health',
      'GET /info',
      'GET /thresholds',
      'GET /signals/:corridor/:timeBucket'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`Signal Aggregation Service started on port ${PORT}`);
  logger.info('Service constraints: READ-ONLY, NO AUTOMATION, ADVISORY ONLY');
  logger.info('Available endpoints:');
  logger.info('  GET /health - Service health check');
  logger.info('  GET /info - Service information');
  logger.info('  GET /thresholds - Current advisory thresholds');
  logger.info('  GET /signals/:corridor/:timeBucket - Get aggregated signals');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

export default app;