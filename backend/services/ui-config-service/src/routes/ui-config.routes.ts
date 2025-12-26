import { Router } from 'express';
import { UIConfigController } from '../controllers/ui-config.controller';

const router = Router();
const controller = new UIConfigController();

/**
 * PUBLIC ROUTES - For Flutter App
 * These endpoints are called by the mobile app to fetch UI configuration
 */

// Get full UI configuration for the app
// GET /api/v1/ui-config
// Query params: platform (ios|android|web), lang (ar|en), version (app version)
router.get('/', controller.getUIConfig);

// Get UI configuration with ETag support for caching
// GET /api/v1/ui-config/cached
router.get('/cached', controller.getUIConfigCached);

// Get only sections (lighter payload)
// GET /api/v1/ui-config/sections
router.get('/sections', controller.getSections);

// Get specific section by ID or slug
// GET /api/v1/ui-config/sections/:identifier
router.get('/sections/:identifier', controller.getSection);

// Get banners for specific position
// GET /api/v1/ui-config/banners?position=home_top
router.get('/banners', controller.getBanners);

// Get active theme
// GET /api/v1/ui-config/theme
router.get('/theme', controller.getTheme);

// Get app configuration
// GET /api/v1/ui-config/app-config
router.get('/app-config', controller.getAppConfig);

// Track analytics (views, clicks)
// POST /api/v1/ui-config/analytics
router.post('/analytics', controller.trackAnalytics);

// Check for updates (returns version number and last_updated)
// GET /api/v1/ui-config/check-update?current_version=123
router.get('/check-update', controller.checkUpdate);

export default router;
