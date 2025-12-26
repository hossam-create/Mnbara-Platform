import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { transferRoutes } from './routes/transfer.routes';
import { matchingRoutes } from './routes/matching.routes';
import { ratesRoutes } from './routes/rates.routes';
import locationRoutes from './routes/location.routes';
import { MatchingEngine } from './services/matching-engine.service';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3016;

// Initialize matching engine
const matchingEngine = new MatchingEngine();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'settlement-service',
    matchingEngine: matchingEngine.isRunning() ? 'running' : 'stopped'
  });
});

// Routes
app.use('/api/transfers', transferRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/rates', ratesRoutes);
app.use('/api/v1/location', locationRoutes);

// Start matching engine
matchingEngine.start();

// Start server
app.listen(PORT, () => {
  console.log(`💱 Settlement Service running on port ${PORT}`);
  console.log(`🔄 Matching Engine started`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  matchingEngine.stop();
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma, matchingEngine };
