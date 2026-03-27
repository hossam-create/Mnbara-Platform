import { Router } from 'express';
import { authRouter } from './auth.routes';
import { userRouter } from './user.routes';
import { orderRouter } from './order.routes';
import { paymentRouter } from './payment.routes';
import { deliveryRouter } from './delivery.routes';
import { activityRouter } from './activity.routes';

export const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'api-gateway',
  });
});

// Service health check
router.get('/health/services', async (req, res) => {
  const { httpClient } = await import('../services/http-client');
  const services = await httpClient.allHealthChecks();
  res.json({
    status: Object.values(services).every(Boolean) ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services,
  });
});

// Mount route modules
router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/orders', orderRouter);
router.use('/payments', paymentRouter);
router.use('/delivery', deliveryRouter);
router.use('/activity', activityRouter);

export default router;
