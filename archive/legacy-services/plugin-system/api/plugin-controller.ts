import { Router } from 'express';
import { PluginManager } from '@mnbara/plugin-manager';
import { PluginMarketplace } from '@mnbara/plugin-marketplace';
import { HookSystem } from '@mnbara/hook-system';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateRequest } from './middleware/validation';
import { requireAuth } from './middleware/auth';
import { requirePermission } from './middleware/permissions';
import { PluginHealthMonitor } from './monitoring/PluginHealthMonitor';

const router = Router();

// Initialize services
const prisma = new PrismaClient();
const hookSystem = new HookSystem();
const healthMonitor = new PluginHealthMonitor();
const pluginManager = new PluginManager({
  pluginsDirectory: './plugins',
  registryPath: './plugin-registry',
  autoLoad: true,
  autoEnable: true,
  sandbox: true,
});

const marketplace = new PluginMarketplace(prisma);

// Validation schemas
const installPluginSchema = z.object({
  pluginIdentifier: z.string().min(1),
  version: z.string().optional(),
  autoActivate: z.boolean().optional().default(false),
});

const activatePluginSchema = z.object({
  pluginName: z.string().min(1),
});

const deactivatePluginSchema = z.object({
  pluginName: z.string().min(1),
});

const uninstallPluginSchema = z.object({
  pluginName: z.string().min(1),
  force: z.boolean().optional().default(false),
});

const updatePluginConfigSchema = z.object({
  pluginName: z.string().min(1),
  config: z.record(z.any()),
});

const searchPluginsSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  minRating: z.number().min(0).max(5).optional(),
  verifiedOnly: z.boolean().optional().default(false),
  sortBy: z.enum(['name', 'rating', 'downloads', 'createdAt']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
});

const ratePluginSchema = z.object({
  pluginName: z.string().min(1),
  rating: z.number().min(1).max(5),
  review: z.string().max(1000).optional(),
});

// Plugin Management Endpoints

/**
 * @route   GET /api/plugins
 * @desc    Get all installed plugins
 * @access  Admin
 */
router.get('/plugins', requireAuth, requirePermission('plugins:read'), async (req, res) => {
  try {
    // TODO: Implement getInstalledPlugins when plugin manager supports it
    // For now, return empty list
    res.json({
      success: true,
      data: [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch plugins',
    });
  }
});

/**
 * @route   POST /api/plugins/install
 * @desc    Install a plugin from marketplace or local path
 * @access  Admin
 */
router.post('/plugins/install', requireAuth, requirePermission('plugins:install'), validateRequest(installPluginSchema), async (req, res) => {
  try {
    const { pluginIdentifier, version, autoActivate } = req.body;
    
    // Record installation attempt
    healthMonitor.recordApiRequest('plugin-system', true, 0);
    
    // TODO: Create a proper manifest from pluginIdentifier and version
    const manifest = {
      metadata: {
        id: pluginIdentifier,
        name: pluginIdentifier,
        version: version || '1.0.0',
        description: 'Plugin installed via API',
        author: 'API User',
        main: 'index.js',
        permissions: [],
        hooks: []
      },
      entry: 'index.js',
      enabled: autoActivate || false,
      installedAt: new Date(),
      config: {}
    };
    
    const result = await pluginManager.installPlugin(manifest);
    
    if (result.success) {
      // Record successful installation
      healthMonitor.recordHeartbeat(pluginIdentifier);
      
      res.json({
        success: true,
        message: 'Plugin installed successfully',
        data: { pluginName: pluginIdentifier },
      });
    } else {
      // Record installation failure
      healthMonitor.recordError('plugin-system', `Installation failed: ${result.error}`);
      
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    // Record installation error
    healthMonitor.recordError('plugin-system', error instanceof Error ? error.message : 'Installation error');
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to install plugin',
    });
  }
});

/**
 * @route   POST /api/plugins/activate
 * @desc    Activate a plugin
 * @access  Admin
 */
router.post('/plugins/activate', requireAuth, requirePermission('plugins:activate'), validateRequest(activatePluginSchema), async (req, res) => {
  try {
    const { pluginName } = req.body;
    
    // Record activation attempt
    healthMonitor.recordApiRequest('plugin-system', true, 0);
    
    const result = await pluginManager.enablePlugin(pluginName);
    
    if (result) {
      // Record successful activation
      healthMonitor.recordHeartbeat(pluginName);
      
      res.json({
        success: true,
        message: 'Plugin activated successfully',
      });
    } else {
      // Record activation failure
      healthMonitor.recordError(pluginName, 'Activation failed');
      
      res.status(400).json({
        success: false,
        error: 'Failed to activate plugin',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to activate plugin',
    });
  }
});

/**
 * @route   POST /api/plugins/deactivate
 * @desc    Deactivate a plugin
 * @access  Admin
 */
router.post('/plugins/deactivate', requireAuth, requirePermission('plugins:deactivate'), validateRequest(deactivatePluginSchema), async (req, res) => {
  try {
    const { pluginName } = req.body;
    const result = await pluginManager.disablePlugin(pluginName);
    
    if (result) {
      res.json({
        success: true,
        message: 'Plugin deactivated successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to deactivate plugin',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deactivate plugin',
    });
  }
});

/**
 * @route   POST /api/plugins/uninstall
 * @desc    Uninstall a plugin
 * @access  Admin
 */
router.post('/plugins/uninstall', requireAuth, requirePermission('plugins:uninstall'), validateRequest(uninstallPluginSchema), async (req, res) => {
  try {
    const { pluginName, force } = req.body;
    const result = await pluginManager.uninstallPlugin(pluginName);
    
    if (result) {
      res.json({
        success: true,
        message: 'Plugin uninstalled successfully',
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Failed to uninstall plugin',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to uninstall plugin',
    });
  }
});

/**
 * @route   PUT /api/plugins/config
 * @desc    Update plugin configuration
 * @access  Admin
 */
router.put('/plugins/config', requireAuth, requirePermission('plugins:configure'), validateRequest(updatePluginConfigSchema), async (req, res) => {
  try {
    const { pluginName, config } = req.body;
    // TODO: Implement updatePluginConfig when plugin manager supports it
    res.status(501).json({
      success: false,
      error: 'Plugin configuration update not implemented yet',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update plugin config',
    });
  }
});

// Marketplace Endpoints

/**
 * @route   GET /api/plugins/marketplace
 * @desc    Search plugins in marketplace
 * @access  Public
 */
router.get('/plugins/marketplace', validateRequest(searchPluginsSchema), async (req, res) => {
  try {
    const options = req.query;
    const plugins = await marketplace.searchPlugins(options);
    
    res.json({
      success: true,
      data: plugins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search plugins',
    });
  }
});

/**
 * @route   GET /api/plugins/marketplace/:pluginName
 * @desc    Get plugin details from marketplace
 * @access  Public
 */
router.get('/plugins/marketplace/:pluginName', async (req, res) => {
  try {
    const { pluginName } = req.params;
    // TODO: Implement marketplace.getPluginDetails when marketplace service is ready
    res.status(501).json({
      success: false,
      error: 'Marketplace functionality not implemented yet',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch plugin details',
    });
  }
});

/**
 * @route   POST /api/plugins/marketplace/:pluginName/rate
 * @desc    Rate a plugin
 * @access  Authenticated
 */
router.post('/plugins/marketplace/:pluginName/rate', requireAuth, validateRequest(ratePluginSchema), async (req, res) => {
  try {
    const { pluginName } = req.params;
    const { rating, review } = req.body;
    const userId = (req as any).user?.id;
    
    // TODO: Implement marketplace.ratePlugin when marketplace service is ready
    const result = { success: false, message: 'Marketplace functionality not implemented yet' };
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rate plugin',
    });
  }
});

/**
 * @route   GET /api/plugins/marketplace/categories
 * @desc    Get plugin categories
 * @access  Public
 */
router.get('/plugins/marketplace/categories', async (req, res) => {
  try {
    const categories = await marketplace.getCategories();
    
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch categories',
    });
  }
});

/**
 * @route   GET /api/plugins/marketplace/trending
 * @desc    Get trending plugins
 * @access  Public
 */
router.get('/plugins/marketplace/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const plugins = await marketplace.getTrendingPlugins(limit);
    
    res.json({
      success: true,
      data: plugins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch trending plugins',
    });
  }
});

/**
 * @route   GET /api/plugins/hooks
 * @desc    Get registered hooks
 * @access  Admin
 */
router.get('/plugins/hooks', requireAuth, requirePermission('plugins:read'), async (req, res) => {
  try {
    // TODO: Implement getRegisteredHooks when hook system is ready
    res.status(501).json({
      success: false,
      error: 'Hook system functionality not implemented yet',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch hooks',
    });
  }
});

/**
 * @route   POST /plugins/hooks/:hookName/trigger
 * @desc    Trigger a hook manually (for testing)
 * @access  Admin
 */
router.post('/plugins/hooks/:hookName/trigger', requireAuth, requirePermission('plugins:test'), async (req, res) => {
  try {
    const { hookName } = req.params;
    const { data } = req.body;
    
    const result = await hookSystem.executeHooks(hookName, data);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to trigger hook',
    });
  }
});

export default router;