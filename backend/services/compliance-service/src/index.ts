import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { complianceRoutes } from './routes/compliance.routes';
import { prohibitedRoutes } from './routes/prohibited.routes';
import { customsRoutes } from './routes/customs.routes';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3012;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'compliance-service' });
});

// Routes
app.use('/api/compliance', complianceRoutes);
app.use('/api/prohibited', prohibitedRoutes);
app.use('/api/customs', customsRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🛃 Compliance Service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export { prisma };
