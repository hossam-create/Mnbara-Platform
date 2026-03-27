// Task Scheduler Service - Main Entry Point
// Inspired by xyOps workflow automation system

import express from 'express';
import dotenv from 'dotenv';
import { SchedulerService } from './services/scheduler.service';
import { createTaskRoutes } from './routes/task.routes';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3012;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Initialize scheduler
const schedulerService = new SchedulerService();

// Routes
app.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'task-scheduler',
    version: '1.0.0',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1/tasks', createTaskRoutes(schedulerService));

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Start server
async function start() {
  try {
    // Start HTTP server
    app.listen(PORT, () => {
      logger.info(`Task Scheduler Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
    });

    // Start scheduler if enabled
    if (process.env.SCHEDULER_ENABLED !== 'false') {
      await schedulerService.start();
    } else {
      logger.warn('Scheduler is disabled');
    }

  } catch (error: any) {
    logger.error(`Failed to start service: ${error.message}`);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await schedulerService.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await schedulerService.stop();
  process.exit(0);
});

// Start the service
start();
