// ============================================================
// Developer Onboarding Controller - API endpoints for Phase 3
// ============================================================

import { Request, Response } from 'express';
import { DeveloperOnboardingService } from './DeveloperOnboardingService';
import { Logger } from '../utils/logger';
import { AuthRequest } from '../../shared/middleware/auth.middleware';

export class DeveloperOnboardingController {
  private service: DeveloperOnboardingService;
  private logger: Logger;

  constructor(service: DeveloperOnboardingService, logger: Logger) {
    this.service = service;
    this.logger = logger;
  }

  /**
   * POST /api/developers/register
   * Register a new developer
   */
  async registerDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const { email, username, password, fullName, company, website, githubUsername, bio } = req.body;

      // Validate input
      if (!email || !username || !password || !fullName) {
        res.status(400).json({
          success: false,
          error: 'Email, username, password, and full name are required'
        });
        return;
      }

      const result = await this.service.registerDeveloper({
        email,
        username,
        password,
        fullName,
        company,
        website,
        githubUsername,
        bio
      });

      // Send verification email
      await this.service.sendVerificationEmail(result.developer.id);

      res.status(201).json({
        success: true,
        data: {
          developer: result.developer,
          token: result.token
        },
        message: 'Registration successful. Please check your email for verification.'
      });
    } catch (error: any) {
      this.logger.error('Failed to register developer', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Registration failed'
      });
    }
  }

  /**
   * POST /api/developers/login
   * Developer login
   */
  async loginDeveloper(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      const result = await this.service.authenticateDeveloper(email, password);

      res.json({
        success: true,
        data: {
          developer: result.developer,
          token: result.token
        }
      });
    } catch (error: any) {
      this.logger.error('Failed to login developer', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }
  }

  /**
   * GET /api/developers/profile
   * Get current developer profile
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const profile = await this.service.getDeveloperProfile(developerId);

      res.json({
        success: true,
        data: profile
      });
    } catch (error: any) {
      this.logger.error('Failed to get developer profile', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to get profile'
      });
    }
  }

  /**
   * PUT /api/developers/profile
   * Update developer profile
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const { fullName, company, website, githubUsername, bio } = req.body;

      const profile = await this.service.updateDeveloperProfile(developerId, {
        fullName,
        company,
        website,
        githubUsername,
        bio
      });

      res.json({
        success: true,
        data: profile,
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      this.logger.error('Failed to update developer profile', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to update profile'
      });
    }
  }

  /**
   * GET /api/developers/stats
   * Get developer statistics
   */
  async getStats(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const stats = await this.service.getDeveloperStats(developerId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      this.logger.error('Failed to get developer stats', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to get stats'
      });
    }
  }

  /**
   * POST /api/developers/api-key/regenerate
   * Regenerate API key
   */
  async regenerateApiKey(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const newApiKey = await this.service.regenerateApiKey(developerId);

      res.json({
        success: true,
        data: {
          apiKey: newApiKey
        },
        message: 'API key regenerated successfully'
      });
    } catch (error: any) {
      this.logger.error('Failed to regenerate API key', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to regenerate API key'
      });
    }
  }

  /**
   * POST /api/developers/verify-email
   * Verify email address
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({
          success: false,
          error: 'Verification token is required'
        });
        return;
      }

      const success = await this.service.verifyEmail(token);

      if (success) {
        res.json({
          success: true,
          message: 'Email verified successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired verification token'
        });
      }
    } catch (error: any) {
      this.logger.error('Failed to verify email', error);
      res.status(500).json({
        success: false,
        error: 'Email verification failed'
      });
    }
  }

  /**
   * POST /api/developers/resend-verification
   * Resend verification email
   */
  async resendVerification(req: AuthRequest, res: Response): Promise<void> {
    try {
      const developerId = req.user?.id;

      if (!developerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      await this.service.sendVerificationEmail(developerId);

      res.json({
        success: true,
        message: 'Verification email sent successfully'
      });
    } catch (error: any) {
      this.logger.error('Failed to resend verification email', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Failed to resend verification email'
      });
    }
  }
}