// ============================================================
// Plugin Routes
// ============================================================

import { Router } from 'express';
import { PluginController } from '../controllers/PluginController';
import { PluginManager } from '../core/PluginManager';
import { PluginRegistry } from '../core/PluginRegistry';
import { PluginMarketplaceAPI } from '../marketplace/PluginMarketplaceAPI';
import { PrismaClient } from '@prisma/client';
import { WinstonLogger } from '../utils/logger';
import { HookRegistry } from '../hooks/HookRegistry';
import { EventBus } from '../events/EventBus';
import { PluginLoader } from '../core/PluginLoader';
import { PluginValidator } from '../core/PluginValidator';
import { PluginSandbox } from '../core/PluginSandbox';
import { ServiceAccess } from '../types/plugin.types';

const router = Router();

// Initialize dependencies (in production, use dependency injection)
const prisma = new PrismaClient();
const logger = new WinstonLogger('plugin-system');
const validator = new PluginValidator(process.env.PLATFORM_VERSION || '1.0.0');
const sandbox = new PluginSandbox(logger);
const loader = new PluginLoader(
  process.env.PLUGINS_DIR || './plugins',
  validator,
  sandbox,
  logger
);
const registry = new PluginRegistry(prisma, logger);
const hooks = new HookRegistry(prisma, logger);
const eventBus = new EventBus(
  process.env.REDIS_URL || 'redis://localhost:6379',
  logger
);

const serviceAccess: ServiceAccess = {
  get: <T>(serviceName: string): T => {
    throw new Error(`Service not implemented: ${serviceName}`);
  },
  has: (serviceName: string): boolean => false,
  list: (): string[] => []
};

const manager = new PluginManager(
  loader,
  registry,
  hooks,
  eventBus,
  prisma,
  logger,
  serviceAccess
);

const marketplace = new PluginMarketplaceAPI(
  prisma,
  logger,
  process.env.PLUGINS_DIR || './plugins'
);

const controller = new PluginController(manager, registry, marketplace, logger);

// Import middleware
import { requireRole } from '../../shared/middleware/auth.middleware';
import { createRateLimiter } from '../../api-gateway/src/middleware/rate-limiter.middleware';

// Create rate limiters
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  routePrefix: 'plugin-marketplace'
});

const sensitiveRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  routePrefix: 'plugin-marketplace-sensitive'
});

// Apply rate limiting to all routes
router.use(generalRateLimiter);

// Routes
router.get('/', controller.listPlugins.bind(controller));
router.get('/:id', controller.getPlugin.bind(controller));

// Protected routes - require authentication
router.post('/:id/install', sensitiveRateLimiter, controller.installPlugin.bind(controller));
router.post('/:id/uninstall', sensitiveRateLimiter, controller.uninstallPlugin.bind(controller));
router.post('/submit', sensitiveRateLimiter, requireRole(['developer', 'admin']), controller.submitPlugin.bind(controller));
router.post('/:id/reviews', controller.addReview.bind(controller));
router.get('/:id/config', controller.getConfig.bind(controller));
router.put('/:id/config', sensitiveRateLimiter, controller.updateConfig.bind(controller));

export default router;

