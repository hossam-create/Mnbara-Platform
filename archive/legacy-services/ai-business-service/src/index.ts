import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import { rbacMiddleware } from './middleware/rbac';
import { rateLimitMiddleware } from './middleware/rateLimit';
import businessRoutes from './routes/business';
import accountRoutes from './routes/accounts';
import transactionRoutes from './routes/transactions';
import invoiceRoutes from './routes/invoices';
import expenseRoutes from './routes/expenses';
import aiRoutes from './routes/ai';
import reportRoutes from './routes/reports';
import accountingRoutes from './routes/accounting';
import platformEventsRoutes from './routes/platform-events';
import financialStatementsRoutes from './routes/financial-statements';
import fpnaRoutes from './routes/fpna';
import financialAnalysisRoutes from './routes/financial-analysis';
import aiFinancialBrainRoutes from './routes/ai-financial-brain';
import whatsappCommandCenterRoutes from './routes/whatsapp-command-center';
import financialSecurityRoutes from './routes/financial-security';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;
const prisma = new PrismaClient();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
app.use(rateLimitMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'ai-business-service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Internal-only API endpoints
app.use('/api/internal', authMiddleware, rbacMiddleware);

// API Routes
app.use('/api/internal/business', businessRoutes);
app.use('/api/internal/accounts', accountRoutes);
app.use('/api/internal/transactions', transactionRoutes);
app.use('/api/internal/invoices', invoiceRoutes);
app.use('/api/internal/expenses', expenseRoutes);
app.use('/api/internal/ai', aiRoutes);
app.use('/api/internal/reports', reportRoutes);
app.use('/api/internal/accounting', accountingRoutes);
app.use('/api/internal/platform-events', platformEventsRoutes);
app.use('/api/internal/financial-statements', financialStatementsRoutes);
app.use('/api/internal/fpna', fpnaRoutes);
app.use('/api/internal/financial-analysis', financialAnalysisRoutes);
app.use('/api/internal/ai-financial-brain', aiFinancialBrainRoutes);
app.use('/api/internal/whatsapp-command-center', whatsappCommandCenterRoutes);
app.use('/api/internal/financial-security', financialSecurityRoutes);

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  logger.info(`AI Business Service started on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
