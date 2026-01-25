/**
 * Internal Ledger Service - Main Application
 * 
 * Simple wallet system with escrow and manual payout functionality
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
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/payouts', payoutRoutes);
app.use('/api/admin/payouts', adminPayoutRoutes);
app.use('/api/admin/financial', adminFinancialRoutes);

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
║  Internal Ledger Service                                  ║
║  Port: ${PORT}                                           ║
║  Environment: ${NODE_ENV}                                ║
║  Status: Running ✓                                        ║
╚═══════════════════════════════════════════════════════════╝
  `);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Payout API: http://localhost:${PORT}/api/payouts`);
  console.log(`Admin API: http://localhost:${PORT}/api/admin/payouts`);
  console.log(`Financial Dashboard: http://localhost:${PORT}/api/admin/financial`);
});

export default app;
