// ============================================================
// Developer Dashboard Routes - Phase 3 Developer Portal
// ============================================================

import { Router } from 'express';
import { DeveloperDashboardController } from './DeveloperDashboardController';
import { DeveloperOnboardingService } from './DeveloperOnboardingService';
import { PluginDocumentationService } from './PluginDocumentationService';
import { PluginMarketplaceAPI } from '../marketplace/PluginMarketplaceAPI';
import { PrismaClient } from '@prisma/client';
import { WinstonLogger } from '../utils/logger';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { createRateLimiter } from '../../api-gateway/src/middleware/rate-limiter.middleware';

const router = Router();

// Initialize dependencies
const prisma = new PrismaClient();
const logger = new WinstonLogger('developer-dashboard');
const onboardingService = new DeveloperOnboardingService(prisma, logger);
const documentationService = new PluginDocumentationService(prisma, logger);
const marketplace = new PluginMarketplaceAPI(prisma, logger, process.env.PLUGINS_DIR || './plugins');

const controller = new DeveloperDashboardController(
  onboardingService,
  documentationService,
  marketplace,
  logger
);

// Create rate limiters
const dashboardRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 200,
  routePrefix: 'developer-dashboard'
});

const analyticsRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
  routePrefix: 'developer-analytics'
});

// Apply authentication and rate limiting to all routes
router.use(authMiddleware);
router.use(dashboardRateLimiter);

/**
 * Dashboard Overview
 * GET /api/developers/dashboard
 */
router.get('/dashboard', controller.getDashboard.bind(controller));

/**
 * Developer Plugins Management
 * GET /api/developers/plugins
 */
router.get('/plugins', controller.getDeveloperPlugins.bind(controller));

/**
 * Developer Analytics
 * GET /api/developers/analytics
 */
router.get('/analytics', analyticsRateLimiter, controller.getAnalytics.bind(controller));

/**
 * Documentation Templates
 * GET /api/developers/documentation/templates
 */
router.get('/documentation/templates', controller.getDocumentationTemplates.bind(controller));

/**
 * Search Documentation
 * POST /api/developers/documentation/search
 */
router.post('/documentation/search', controller.searchDocumentation.bind(controller));

/**
 * Support Tickets
 * GET /api/developers/support/tickets
 */
router.get('/support/tickets', controller.getSupportTickets.bind(controller));

export default router;