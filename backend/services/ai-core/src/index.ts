/**
 * AI Core Nucleus Service
 * Deterministic, read-only AI Assistant Core
 * 
 * Capabilities:
 * - Intent classification (buy, sell, exchange, transfer)
 * - Trust score computation
 * - Risk assessment
 * - User matching
 * - Decision recommendations
 * 
 * Constraints:
 * - NO execution
 * - NO payments
 * - NO auto-actions
 * - Deterministic logic only
 * - Explainable outputs
 * - Full auditability
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import aiCoreRoutes from './routes/ai-core.routes';

const app = express();
const PORT = process.env.PORT || 3010;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`
    );
  });
  next();
});

// Routes
app.use('/api/ai-core', aiCoreRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'AI Core Nucleus',
    version: '1.0.0',
    description: 'Deterministic, read-only AI advisory service',
    capabilities: [
      'Intent classification',
      'Trust scoring',
      'Risk assessment',
      'User matching',
      'Decision recommendations',
    ],
    constraints: [
      'Read-only operations',
      'No execution',
      'No payments',
      'No auto-actions',
      'Deterministic logic',
      'Full auditability',
    ],
    endpoints: {
      health: '/api/ai-core/health',
      intent: 'POST /api/ai-core/intent/classify',
      trust: 'POST /api/ai-core/trust/compute',
      risk: 'POST /api/ai-core/risk/assess',
      match: 'POST /api/ai-core/match/users',
      recommend: 'POST /api/ai-core/recommend',
      audit: 'GET /api/ai-core/audit',
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
  });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[ERROR] ${err.message}`, err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   AI Core Nucleus                         ║
║           Deterministic Advisory Service                  ║
╠═══════════════════════════════════════════════════════════╣
║  Status: Running                                          ║
║  Port: ${PORT}                                              ║
║  Mode: ${process.env.NODE_ENV || 'development'}                                     ║
╠═══════════════════════════════════════════════════════════╣
║  Constraints:                                             ║
║  ✓ Read-only operations                                   ║
║  ✓ No execution                                           ║
║  ✓ No payments                                            ║
║  ✓ No auto-actions                                        ║
║  ✓ Deterministic logic                                    ║
║  ✓ Full auditability                                      ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

export default app;
