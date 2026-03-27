// ============================================================
// Plugin Documentation Routes - Phase 3 Documentation Management
// ============================================================

import { Router } from 'express';
import { PluginDocumentationService } from './PluginDocumentationService';
import { WinstonLogger } from '../utils/logger';
import { authMiddleware } from '../../shared/middleware/auth.middleware';
import { createRateLimiter } from '../../api-gateway/src/middleware/rate-limiter.middleware';
import { PrismaClient } from '@prisma/client';

const router = Router();

// Initialize dependencies
const prisma = new PrismaClient();
const logger = new WinstonLogger('plugin-documentation');
const documentationService = new PluginDocumentationService(prisma, logger);

// Create rate limiters
const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  routePrefix: 'plugin-docs'
});

const sensitiveRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 20,
  routePrefix: 'plugin-docs-sensitive'
});

// Apply general rate limiting to all routes
router.use(generalRateLimiter);

/**
 * Get plugin documentation (public)
 * GET /api/plugins/:pluginId/documentation
 */
router.get('/:pluginId/documentation', async (req, res) => {
  try {
    const { pluginId } = req.params;
    const version = req.query.version as string;

    const documentation = await documentationService.getDocumentation(pluginId, version);

    if (!documentation) {
      res.status(404).json({
        success: false,
        error: 'Documentation not found'
      });
      return;
    }

    if (!documentation.isPublished) {
      res.status(403).json({
        success: false,
        error: 'Documentation not published'
      });
      return;
    }

    res.json({
      success: true,
      data: documentation
    });
  } catch (error: any) {
    logger.error('Failed to get plugin documentation', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get documentation'
    });
  }
});

/**
 * Get documentation versions (public)
 * GET /api/plugins/:pluginId/documentation/versions
 */
router.get('/:pluginId/documentation/versions', async (req, res) => {
  try {
    const { pluginId } = req.params;

    const versions = await documentationService.getDocumentationVersions(pluginId);

    res.json({
      success: true,
      data: versions
    });
  } catch (error: any) {
    logger.error('Failed to get documentation versions', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get versions'
    });
  }
});

/**
 * Search documentation (public)
 * POST /api/plugins/documentation/search
 */
router.post('/documentation/search', async (req, res) => {
  try {
    const { query, category, limit } = req.body;

    if (!query) {
      res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
      return;
    }

    const results = await documentationService.searchDocumentation(
      query,
      category,
      limit
    );

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    logger.error('Failed to search documentation', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search documentation'
    });
  }
});

/**
 * Get documentation templates (public)
 * GET /api/plugins/documentation/templates
 */
router.get('/documentation/templates', async (req, res) => {
  try {
    const templates = await documentationService.getDocumentationTemplates();

    res.json({
      success: true,
      data: templates
    });
  } catch (error: any) {
    logger.error('Failed to get documentation templates', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get templates'
    });
  }
});

// Protected routes - require authentication
router.use(authMiddleware);

/**
 * Create or update documentation (protected)
 * POST /api/plugins/:pluginId/documentation
 */
router.post('/:pluginId/documentation', sensitiveRateLimiter, async (req, res) => {
  try {
    const { pluginId } = req.params;
    const developerId = req.user?.id;
    const { version, sections, isPublished } = req.body;

    if (!developerId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const documentation = await documentationService.createDocumentation(
      pluginId,
      developerId,
      { version, sections, isPublished }
    );

    res.json({
      success: true,
      data: documentation,
      message: 'Documentation created/updated successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create documentation', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create documentation'
    });
  }
});

/**
 * Publish documentation (protected)
 * POST /api/plugins/:pluginId/documentation/publish
 */
router.post('/:pluginId/documentation/publish', sensitiveRateLimiter, async (req, res) => {
  try {
    const { pluginId } = req.params;
    const developerId = req.user?.id;
    const { version } = req.body;

    if (!developerId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const documentation = await documentationService.publishDocumentation(
      pluginId,
      developerId,
      version
    );

    res.json({
      success: true,
      data: documentation,
      message: 'Documentation published successfully'
    });
  } catch (error: any) {
    logger.error('Failed to publish documentation', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to publish documentation'
    });
  }
});

/**
 * Unpublish documentation (protected)
 * POST /api/plugins/:pluginId/documentation/unpublish
 */
router.post('/:pluginId/documentation/unpublish', sensitiveRateLimiter, async (req, res) => {
  try {
    const { pluginId } = req.params;
    const developerId = req.user?.id;
    const { version } = req.body;

    if (!developerId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const documentation = await documentationService.unpublishDocumentation(
      pluginId,
      developerId,
      version
    );

    res.json({
      success: true,
      data: documentation,
      message: 'Documentation unpublished successfully'
    });
  } catch (error: any) {
    logger.error('Failed to unpublish documentation', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to unpublish documentation'
    });
  }
});

/**
 * Delete documentation (protected)
 * DELETE /api/plugins/:pluginId/documentation
 */
router.delete('/:pluginId/documentation', sensitiveRateLimiter, async (req, res) => {
  try {
    const { pluginId } = req.params;
    const developerId = req.user?.id;
    const { version } = req.body;

    if (!developerId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    await documentationService.deleteDocumentation(pluginId, developerId, version);

    res.json({
      success: true,
      message: 'Documentation deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete documentation', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to delete documentation'
    });
  }
});

/**
 * Create documentation from template (protected)
 * POST /api/plugins/:pluginId/documentation/from-template
 */
router.post('/:pluginId/documentation/from-template', sensitiveRateLimiter, async (req, res) => {
  try {
    const { pluginId } = req.params;
    const developerId = req.user?.id;
    const { templateId, version } = req.body;

    if (!developerId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
      return;
    }

    const documentation = await documentationService.createFromTemplate(
      pluginId,
      developerId,
      templateId,
      version
    );

    res.json({
      success: true,
      data: documentation,
      message: 'Documentation created from template successfully'
    });
  } catch (error: any) {
    logger.error('Failed to create documentation from template', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to create documentation from template'
    });
  }
});

export default router;