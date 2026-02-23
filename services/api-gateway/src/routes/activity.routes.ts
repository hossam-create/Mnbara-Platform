/**
 * Activity Routes
 * 
 * Routes for the aggregated activity endpoint.
 * Base path: /api/activity
 */

import { Router } from 'express';
import { activityController } from '../controllers/activity.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { userRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// Apply authentication and rate limiting to all activity routes
router.use(authMiddleware);
router.use(userRateLimiter);

/**
 * GET /api/activity
 * 
 * Query Parameters:
 * - domain: Filter by domain (wallet | traveler | marketplace | all) [default: all]
 * - limit: Number of items per page [default: 20, max: 100]
 * - cursor: Pagination cursor for next page
 * - startDate: Filter activities from this date (ISO 8601)
 * - endDate: Filter activities until this date (ISO 8601)
 * 
 * Response:
 * {
 *   success: true,
 *   data: UnifiedActivityDTO[],
 *   meta: {
 *     total: number,
 *     page: number,
 *     limit: number,
 *     hasMore: boolean,
 *     cursor?: string,
 *     partial: boolean,
 *     failedDomains: ActivityDomain[],
 *     cached: boolean,
 *     cachedAt?: string
 *   }
 * }
 */
router.get('/', activityController.getActivity.bind(activityController));

/**
 * GET /api/activity/health
 * Health check for the activity aggregation service
 */
router.get('/health', activityController.getHealth.bind(activityController));

/**
 * POST /api/activity/invalidate-cache
 * Invalidate cache for the authenticated user (admin/debug use)
 */
router.post('/invalidate-cache', activityController.invalidateCache.bind(activityController));

export { router as activityRouter };
export default router;
