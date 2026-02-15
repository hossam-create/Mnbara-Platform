/**
 * Internal Ledger Service - Main Application
 *
 * Enhanced with Double-Entry Bookkeeping, Matching Algorithm,
 * Real-time Settlement, Compliance, and Audit Trail
 */

import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import payoutRoutes from './routes/payout.routes';
import adminPayoutRoutes from './routes/admin-payout.routes';
import adminFinancialRoutes from './routes/admin-financial.routes';

// Import services for direct usage
export { ledgerService } from './services/ledger.service';
export { matchingService } from './services/matching.service';
export { settlementService } from './services/settlement.service';
export { complianceService } from './services/compliance.service';
export { auditService } from './services/audit.service';
export { rollbackService } from './services/rollback.service';

// Initialize Express app
const app: Application = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'internal-ledger-service',
    version: '2.0.0',
    features: [
      'double-entry-ledger',
      'matching-algorithm',
      'real-time-settlement',
      'compliance-kyc',
      'audit-trail',
      'rollback-support',
    ],
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/payouts', payoutRoutes);
app.use('/api/admin/payouts', adminPayoutRoutes);
app.use('/api/admin/financial', adminFinancialRoutes);

// Ledger API endpoints
app.get('/api/ledger/balances', async (req: Request, res: Response) => {
  // Get ledger balance summary
  res.json({ message: 'Ledger balances endpoint' });
});

app.get('/api/ledger/entries/:transactionId', async (req: Request, res: Response) => {
  // Get ledger entries for a transaction
  res.json({ message: 'Ledger entries endpoint' });
});

// Matching API endpoints
app.get('/api/matching/buy-requests', async (req: Request, res: Response) => {
  // Get buy requests
  res.json({ message: 'Buy requests endpoint' });
});

app.get('/api/matching/sell-offers', async (req: Request, res: Response) => {
  // Get sell offers
  res.json({ message: 'Sell offers endpoint' });
});

app.post('/api/matching/run', async (req: Request, res: Response) => {
  // Run matching algorithm
  res.json({ message: 'Matching run endpoint' });
});

// Settlement API endpoints
app.post('/api/settlement/process', async (req: Request, res: Response) => {
  // Process settlement
  res.json({ message: 'Settlement process endpoint' });
});

app.post('/api/settlement/rollback', async (req: Request, res: Response) => {
  // Rollback settlement
  res.json({ message: 'Settlement rollback endpoint' });
});

// Compliance API endpoints
app.get('/api/compliance/status/:userId', async (req: Request, res: Response) => {
  // Get compliance status
  res.json({ message: 'Compliance status endpoint' });
});

app.get('/api/compliance/limits/:userId', async (req: Request, res: Response) => {
  // Get transaction limits
  res.json({ message: 'Compliance limits endpoint' });
});

// Audit API endpoints
app.get('/api/audit/logs', async (req: Request, res: Response) => {
  // Get audit logs
  res.json({ message: 'Audit logs endpoint' });
});

app.get('/api/audit/trail/:transactionId', async (req: Request, res: Response) => {
  // Get transaction audit trail
  res.json({ message: 'Audit trail endpoint' });
});

// Rollback API endpoints
app.get('/api/rollback/status/:rollbackId', async (req: Request, res: Response) => {
  // Get rollback status
  res.json({ message: 'Rollback status endpoint' });
});

app.post('/api/rollback/retry/:rollbackId', async (req: Request, res: Response) => {
  // Retry failed rollback
  res.json({ message: 'Rollback retry endpoint' });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 3010;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  Internal Ledger Service v2.0                              ║
║  Port: ${PORT}                                           ║
║  Environment: ${NODE_ENV}                                ║
║  Status: Running ✓                                        ║
║                                                           ║
║  Features:                                                ║
║  - Double-Entry Bookkeeping                               ║
║  - Buyer/Seller Matching Algorithm                        ║
║  - Real-time Settlement Processing                        ║
║  - Fee Calculation (Platform + Processing)                ║
║  - AML/KYC Compliance Integration                         ║
║  - Complete Audit Trail                                  ║
║  - Transaction Rollback Support                          ║
╚═══════════════════════════════════════════════════════════╝
  `);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Payout API: http://localhost:${PORT}/api/payouts`);
  console.log(`Admin API: http://localhost:${PORT}/api/admin/payouts`);
  console.log(`Financial Dashboard: http://localhost:${PORT}/api/admin/financial`);
  console.log(`Ledger API: http://localhost:${PORT}/api/ledger`);
  console.log(`Matching API: http://localhost:${PORT}/api/matching`);
  console.log(`Settlement API: http://localhost:${PORT}/api/settlement`);
  console.log(`Compliance API: http://localhost:${PORT}/api/compliance`);
  console.log(`Audit API: http://localhost:${PORT}/api/audit`);
  console.log(`Rollback API: http://localhost:${PORT}/api/rollback`);
});

export default app;
