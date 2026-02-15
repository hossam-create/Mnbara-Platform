// ============================================================
// Developer Onboarding Routes - Phase 3 Implementation
// ============================================================

import { Router } from 'express';
import { DeveloperOnboardingService } from './DeveloperOnboardingService';
import { DeveloperOnboardingController } from './DeveloperOnboardingController';
import { PrismaClient } from '@prisma/client';
import { WinstonLogger } from '../utils/logger';
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { createRateLimiter } from '../../api-gateway/src/middleware/rate-limiter.middleware';

const router = Router();

// Initialize dependencies
const prisma = new PrismaClient();
const logger = new WinstonLogger('developer-onboarding');
const service = new DeveloperOnboardingService(prisma, logger);
const controller = new DeveloperOnboardingController(service, logger);

// Create rate limiters
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // Strict limit for auth endpoints
  routePrefix: 'developer-auth'
});

const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  routePrefix: 'developer-general'
});

// Public routes (registration and login)
router.post('/register', authRateLimiter, controller.registerDeveloper.bind(controller));
router.post('/login', authRateLimiter, controller.loginDeveloper.bind(controller));
router.post('/verify-email', controller.verifyEmail.bind(controller));

// Protected routes (require authentication)
router.use(authMiddleware); // Apply authentication to all routes below
router.use(generalRateLimiter); // Apply general rate limiting

router.get('/profile', controller.getProfile.bind(controller));
router.put('/profile', controller.updateProfile.bind(controller));
router.get('/stats', controller.getStats.bind(controller));
router.post('/api-key/regenerate', controller.regenerateApiKey.bind(controller));
router.post('/resend-verification', controller.resendVerification.bind(controller));

export default router;