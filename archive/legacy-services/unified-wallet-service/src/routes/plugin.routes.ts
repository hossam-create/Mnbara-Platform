import { Router } from 'express';
import { PluginIntegrationService } from '../services/plugin-integration.service';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../index';

const router = Router();
const pluginService = PluginIntegrationService.getInstance(prisma);

/**
 * @route   GET /api/v1/plugins/health
 * @desc    Get plugin system health status
 * @access  Admin
 */
router.get('/health', requireAuth, async (req, res) => {
  try {
    const health = await pluginService.getHealthStatus();
    res.json({
      success: true,
      data: health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get plugin health status',
    });
  }
});

/**
 * @route   GET /api/v1/plugins
 * @desc    Get all installed plugins
 * @access  Admin
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const plugins = await pluginService.getInstalledPlugins();
    res.json({
      success: true,
      data: plugins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch plugins',
    });
  }
});

/**
 * @route   POST /api/v1/plugins/install
 * @desc    Install a plugin
 * @access  Admin
 */
router.post('/install', requireAuth, async (req, res) => {
  try {
    const { pluginIdentifier, version, autoActivate } = req.body;
    const result = await pluginService.installPlugin(pluginIdentifier, { version, autoActivate });
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        data: result.data,
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
      error: error instanceof Error ? error.message : 'Failed to install plugin',
    });
  }
});

/**
 * @route   POST /api/v1/plugins/activate
 * @desc    Activate a plugin
 * @access  Admin
 */
router.post('/activate', requireAuth, async (req, res) => {
  try {
    const { pluginName } = req.body;
    const result = await pluginService.activatePlugin(pluginName);
    
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
      error: error instanceof Error ? error.message : 'Failed to activate plugin',
    });
  }
});

/**
 * @route   POST /api/v1/plugins/deactivate
 * @desc    Deactivate a plugin
 * @access  Admin
 */
router.post('/deactivate', requireAuth, async (req, res) => {
  try {
    const { pluginName } = req.body;
    const result = await pluginService.deactivatePlugin(pluginName);
    
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
      error: error instanceof Error ? error.message : 'Failed to deactivate plugin',
    });
  }
});

/**
 * @route   POST /api/v1/plugins/uninstall
 * @desc    Uninstall a plugin
 * @access  Admin
 */
router.post('/uninstall', requireAuth, async (req, res) => {
  try {
    const { pluginName, force } = req.body;
    const result = await pluginService.uninstallPlugin(pluginName, { force });
    
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
      error: error instanceof Error ? error.message : 'Failed to uninstall plugin',
    });
  }
});

/**
 * @route   PUT /api/v1/plugins/config
 * @desc    Update plugin configuration
 * @access  Admin
 */
router.put('/config', requireAuth, async (req, res) => {
  try {
    const { pluginName, config } = req.body;
    const result = await pluginService.updatePluginConfig(pluginName, config);
    
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
      error: error instanceof Error ? error.message : 'Failed to update plugin config',
    });
  }
});

/**
 * @route   GET /api/v1/plugins/marketplace/search
 * @desc    Search plugins in marketplace
 * @access  Admin
 */
router.get('/marketplace/search', requireAuth, async (req, res) => {
  try {
    const options = {
      query: req.query.query as string,
      category: req.query.category as string,
      tags: req.query.tags ? (req.query.tags as string).split(',') : undefined,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      verifiedOnly: req.query.verifiedOnly === 'true',
      sortBy: req.query.sortBy as string,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
    };
    
    const plugins = await pluginService.searchMarketplacePlugins(options);
    res.json({
      success: true,
      data: plugins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search marketplace plugins',
    });
  }
});

/**
 * @route   GET /api/v1/plugins/marketplace/:pluginName
 * @desc    Get plugin details from marketplace
 * @access  Admin
 */
router.get('/marketplace/:pluginName', requireAuth, async (req, res) => {
  try {
    const { pluginName } = req.params;
    const plugin = await pluginService.getPluginDetails(pluginName);
    
    if (plugin) {
      res.json({
        success: true,
        data: plugin,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Plugin not found in marketplace',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get plugin details',
    });
  }
});

/**
 * @route   POST /api/v1/plugins/marketplace/:pluginName/rate
 * @desc    Rate a plugin in marketplace
 * @access  Admin
 */
router.post('/marketplace/:pluginName/rate', requireAuth, async (req, res) => {
  try {
    const { pluginName } = req.params;
    const { rating, review } = req.body;
    const userId = req.user.id;
    
    const result = await pluginService.ratePlugin(pluginName, userId, rating, review);
    
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

export default router;