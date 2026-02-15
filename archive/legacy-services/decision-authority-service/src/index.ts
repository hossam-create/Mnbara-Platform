import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import config from './config/config';
import { DecisionSourceFactory } from './sources/DecisionSourceFactory';

// Load environment variables
dotenv.config();

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  const decisionSource = DecisionSourceFactory.getDecisionSource();
  
  res.json({ 
    status: 'healthy', 
    service: 'decision-authority-service',
    mode: config.decisionAuthorityMode,
    source: decisionSource.getSourceName(),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    service: 'Decision Authority Service',
    version: '1.0.0',
    mode: config.decisionAuthorityMode,
    endpoints: {
      health: '/health'
    }
  });
});

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  console.log(`========================================`);
  console.log(`Decision Authority Service`);
  console.log(`========================================`);
  console.log(`Port: ${PORT}`);
  console.log(`Mode: ${config.decisionAuthorityMode}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`========================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export { app };
