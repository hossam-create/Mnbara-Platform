import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import exchangeRequestRoutes from './exchange-request.routes';
import marketplaceRoutes from './marketplace.routes';
import matchRoutes from './match.routes';
import settlementRoutes from './settlement.routes';
import securityRoutes from './security.routes';
import communicationRoutes from './communication.routes';
import adminExchangeRoutes from './admin-exchange.routes';

const router = Router();

/**
 * Mount route modules
 * Note: Settlement routes include webhooks that don't require auth
 */
router.use('/settlements', settlementRoutes);

/**
 * Apply authentication middleware to protected routes
 */
router.use(authenticate);

router.use('/requests', exchangeRequestRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/matches', matchRoutes);
router.use('/', securityRoutes); // Security routes are at root level
router.use('/', communicationRoutes); // Communication routes are at root level

/**
 * Admin routes (requires admin authentication)
 */
router.use('/admin/exchange', adminExchangeRoutes);

export default router;
