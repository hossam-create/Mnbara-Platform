import { Router } from 'express';
import { SecurityController } from '../controllers/security.controller';
import { addDepositValidator } from '../validators/security.validator';

const router = Router();
const securityController = new SecurityController();

/**
 * GET /api/v1/exchange/security-deposit
 * Get user's security deposit
 */
router.get('/security-deposit', securityController.getSecurityDeposit);

/**
 * POST /api/v1/exchange/security-deposit/add
 * Add to security deposit
 */
router.post(
  '/security-deposit/add',
  addDepositValidator,
  securityController.addToSecurityDeposit
);

/**
 * GET /api/v1/exchange/trust-level
 * Get user's trust level
 */
router.get('/trust-level', securityController.getTrustLevel);

/**
 * GET /api/v1/exchange/external-escrow-providers
 * Get available external escrow providers
 */
router.get('/external-escrow-providers', securityController.getExternalEscrowProviders);

export default router;
