import { Router } from 'express';
import { BalanceController } from '../controllers/balance.controller';

const router = Router();
const balanceController = new BalanceController();

// Check if user has sufficient balance
router.post('/check', balanceController.checkBalance);
router.post('/check/:userId', balanceController.checkBalance);

// Get detailed balance information
router.get('/detailed/:userId', balanceController.getDetailedBalance);

// Reserve balance for a pending payment
router.post('/reserve', balanceController.reserveBalance);
router.post('/reserve/:userId', balanceController.reserveBalance);

// Release a balance reservation
router.delete('/reservation/:reservationId', balanceController.releaseReservation);

// Confirm a reservation and deduct from wallet
router.post('/reservation/:reservationId/confirm', balanceController.confirmReservation);

// Pre-authorize a payment amount
router.post('/authorize', balanceController.preAuthorize);
router.post('/authorize/:userId', balanceController.preAuthorize);

// Capture a pre-authorized amount
router.post('/authorization/:authorizationId/capture', balanceController.captureAuthorization);

// Void a pre-authorization
router.post('/authorization/:authorizationId/void', balanceController.voidAuthorization);

export default router;
