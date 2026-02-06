/**
 * Session Controller
 * Handles session management endpoints
 */

import { Request, Response } from 'express';
import { sessionService } from '../services/session.service';
import { logger } from '../utils/logger';

export class SessionController {
  /**
   * Get all sessions for the current user
   */
  async getMySessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const sessions = await sessionService.getUserSessions(userId);
      res.json({ sessions });
    } catch (error) {
      logger.error('Error getting user sessions:', error);
      res.status(500).json({ error: 'Failed to get sessions' });
    }
  }

  /**
   * Get current session details
   */
  async getCurrentSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        res.status(400).json({ error: 'Session ID required' });
        return;
      }

      const result = await sessionService.validateSession(sessionId);
      if (!result.valid) {
        res.status(401).json({ error: result.reason });
        return;
      }

      res.json({ session: result.session });
    } catch (error) {
      logger.error('Error getting current session:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  }

  /**
   * Delete current session (logout from current device)
   */
  async deleteCurrentSession(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        res.status(400).json({ error: 'Session ID required' });
        return;
      }

      await sessionService.deleteSession(sessionId);
      res.json({ message: 'Session deleted successfully' });
    } catch (error) {
      logger.error('Error deleting session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  }

  /**
   * Delete all other sessions (logout from all other devices)
   */
  async deleteOtherSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      const sessionId = req.headers['x-session-id'] as string;

      if (!userId || !sessionId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await sessionService.deleteOtherSessions(userId, sessionId);
      res.json({ message: `Deleted ${count} other sessions` });
    } catch (error) {
      logger.error('Error deleting other sessions:', error);
      res.status(500).json({ error: 'Failed to delete sessions' });
    }
  }

  /**
   * Delete all sessions (logout from everywhere)
   */
  async deleteAllSessions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const count = await sessionService.deleteAllUserSessions(userId);
      res.json({ message: `Deleted ${count} sessions` });
    } catch (error) {
      logger.error('Error deleting all sessions:', error);
      res.status(500).json({ error: 'Failed to delete sessions' });
    }
  }

  /**
   * Update session activity
   */
  async updateActivity(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.headers['x-session-id'] as string;
      if (!sessionId) {
        res.status(400).json({ error: 'Session ID required' });
        return;
      }

      const success = await sessionService.updateSessionActivity(sessionId);
      if (success) {
        res.json({ message: 'Session activity updated' });
      } else {
        res.status(404).json({ error: 'Session not found' });
      }
    } catch (error) {
      logger.error('Error updating session activity:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  }

  /**
   * Get session statistics (admin)
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await sessionService.getSessionStats();
      res.json(stats);
    } catch (error) {
      logger.error('Error getting session stats:', error);
      res.status(500).json({ error: 'Failed to get statistics' });
    }
  }

  /**
   * Cleanup expired sessions (admin)
   */
  async cleanupExpired(req: Request, res: Response): Promise<void> {
    try {
      const count = await sessionService.cleanupExpiredSessions();
      res.json({ message: `Cleaned up ${count} expired sessions` });
    } catch (error) {
      logger.error('Error cleaning up sessions:', error);
      res.status(500).json({ error: 'Failed to cleanup sessions' });
    }
  }
}

export const sessionController = new SessionController();
