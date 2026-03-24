/**
 * Session Routes
 * Endpoints for session management
 */

import { Router } from 'express';
import { sessionController } from '../controllers/session.controller';
import { authenticateJWT } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route GET /api/sessions/me
 * @desc Get all sessions for current user
 * @access Private
 */
router.get('/me', authenticateJWT, (req, res) => sessionController.getMySessions(req, res));

/**
 * @route GET /api/sessions/current
 * @desc Get current session details
 * @access Private
 */
router.get('/current', authenticateJWT, (req, res) => sessionController.getCurrentSession(req, res));

/**
 * @route DELETE /api/sessions/current
 * @desc Delete current session (logout from current device)
 * @access Private
 */
router.delete('/current', authenticateJWT, (req, res) => sessionController.deleteCurrentSession(req, res));

/**
 * @route DELETE /api/sessions/others
 * @desc Delete all other sessions (logout from other devices)
 * @access Private
 */
router.delete('/others', authenticateJWT, (req, res) => sessionController.deleteOtherSessions(req, res));

/**
 * @route DELETE /api/sessions/all
 * @desc Delete all sessions (logout from everywhere)
 * @access Private
 */
router.delete('/all', authenticateJWT, (req, res) => sessionController.deleteAllSessions(req, res));

/**
 * @route PATCH /api/sessions/activity
 * @desc Update session activity
 * @access Private
 */
router.patch('/activity', authenticateJWT, (req, res) => sessionController.updateActivity(req, res));

/**
 * @route GET /api/sessions/stats
 * @desc Get session statistics (admin)
 * @access Private (Admin)
 */
router.get('/stats', authenticateJWT, (req, res) => sessionController.getStats(req, res));

/**
 * @route POST /api/sessions/cleanup
 * @desc Cleanup expired sessions (admin)
 * @access Private (Admin)
 */
router.post('/cleanup', authenticateJWT, (req, res) => sessionController.cleanupExpired(req, res));

export default router;
