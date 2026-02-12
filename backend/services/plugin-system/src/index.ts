// ============================================================
// Plugin System Service - Main Entry Point
// ============================================================

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PluginLoader } from './core/PluginLoader';
import { PluginValidator } from './core/PluginValidator';
import { PluginSandbox } from './core/PluginSandbox';
import { PluginRegistry } from './core/PluginRegistry';
import { HookRegistry } from './hooks/HookRegistry';
import { EventBus } from './events/EventBus';
import { WinstonLogger } from './utils/logger';
import { PluginManager } from './core/PluginManager';
import { ServiceAccess } from './types/plugin.types';
import { EbayLivePluginIntegration } from '../integrations/ebay-live-plugin-integration';
import { AuditService } from '../../shared/audit/audit.service';
import { PluginTestingFramework } from '../testing/PluginTestingFramework';
import { PluginTestRunner } from '../testing/test-runner';

const app = express();
const PORT = process.env.PORT || 3015;

// Initialize dependencies
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

// Service Access (simplified - should be connected to actual services)
const serviceAccess: ServiceAccess = {
  get: <T>(serviceName: string): T => {
    // This should return actual service instances
    // For now, return mock
    throw new Error(`Service not implemented: ${serviceName}`);
  },
  has: (serviceName: string): boolean => {
    // Check if service exists
    return false;
  },
  list: (): string[] => {
    return [];
  }
};

// Middleware
app.use(express.json());

// Import shared middleware
import { authMiddleware, requireRole } from '../../shared/middleware/auth.middleware';
import { createRateLimiter } from '../../api-gateway/src/middleware/rate-limiter.middleware';

// Create rate limiters
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  routePrefix: 'plugin-system'
});

const sensitiveRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  routePrefix: 'plugin-system-sensitive'
});

// Middleware setup
app.use(generalRateLimiter); // Apply general rate limiting to all routes

// Health check (public)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'plugin-system' });
});

// Protected routes
app.use('/api/plugins', authMiddleware); // Require authentication for plugin routes

// Protected routes
app.use('/api/plugins', authMiddleware); // Require authentication for plugin routes

// Import routes
import pluginRoutes from './routes/plugin.routes';
import developerRoutes from './developer-onboarding';
import developerDashboardRoutes from './developer-onboarding/developer-dashboard.routes';
import documentationRoutes from './developer-onboarding/documentation.routes';

// Use plugin routes
app.use('/api/plugins', pluginRoutes);
app.use('/api/developers', developerRoutes);
app.use('/api/developers', developerDashboardRoutes);
app.use('/api/plugins', documentationRoutes);

// Initialize Plugin Manager
const pluginManager = new PluginManager(
  loader,
  registry,
  hooks,
  eventBus,
  prisma,
  logger,
  serviceAccess
);

// Initialize eBay Live Plugin Integration
const auditService = new AuditService(prisma);
const ebayLiveIntegration = new EbayLivePluginIntegration(hooks, auditService);

// Start server
async function start() {
  try {
    // Initialize eBay Live Plugin Integration
    await ebayLiveIntegration.initialize();
    logger.info('eBay Live Plugin Integration initialized');

    // Load hooks from database
    await hooks.loadHooksFromDatabase();

    // Load all plugins
    logger.info('Loading plugins...');
    const results = await loader.loadAllPlugins();
    const successCount = results.filter(r => r.success).length;
    logger.info(`Loaded ${successCount}/${results.length} plugins`);

    // Initialize loaded plugins
    for (const result of results) {
      if (result.success && result.pluginId) {
        try {
          // Get plugin metadata to check if registered
          const metadata = await registry.getPlugin(result.pluginId);
          if (metadata && metadata.status === 'ACTIVE') {
            await pluginManager.initializePlugin(result.pluginId);
          }
        } catch (error: any) {
          logger.warn(`Failed to initialize plugin ${result.pluginId}`, error);
        }
      }
    }

    app.listen(PORT, () => {
      logger.info(`Plugin System Service running on port ${PORT}`);
    });
  } catch (error: any) {
    logger.error('Failed to start service', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await eventBus.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();

export {
  loader,
  registry,
  hooks,
  eventBus,
  logger,
  ebayLiveIntegration,
  PluginTestingFramework,
  PluginTestRunner
};

