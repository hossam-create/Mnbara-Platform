/**
 * Routes Index
 * 
 * Exports all route modules for the Request Engine service.
 */

import { Router } from 'express';
import { Pool } from 'pg';
import { createDisputeRoutes } from './disputeRoutes';
import { createAdminDisputeRoutes } from './adminDisputeRoutes';

/**
 * Create all routes for the application
 * 
 * @param db - PostgreSQL connection pool
 * @returns Express router with all routes
 */
export function createRoutes(db: Pool): Router {
  const router = Router();

  // Health check endpoint
  router.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      service: 'request-engine',
      timestamp: new Date().toISOString()
    });
  });

  // Dispute routes
  const disputeRoutes = createDisputeRoutes(db);
  router.use('/api', disputeRoutes);

  // Admin dispute routes
  const adminDisputeRoutes = createAdminDisputeRoutes(db);
  router.use('/api', adminDisputeRoutes);

  return router;
}
