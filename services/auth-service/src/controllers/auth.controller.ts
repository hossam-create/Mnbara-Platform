import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sessionService } from '../services/session.service';
import { logger } from '../utils/logger';
import { OAuthProfile } from '../types/auth.types';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Register with email/password
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      const user = await this.authService.register({ email, password, name });
      const tokens = this.authService.generateTokens(user);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          tokens,
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      });
    }
  }

  // Login with email/password
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        });
        return;
      }

      const { user, tokens } = await this.authService.login({ email, password });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          },
          tokens,
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      });
    }
  }

  // OAuth callback handler
  async oauthCallback(req: Request, res: Response): Promise<void> {
    try {
      const profile = req.user as OAuthProfile;

      if (!profile) {
        res.status(401).json({
          success: false,
          error: 'OAuth authentication failed',
        });
        return;
      }

      const { user, tokens, isNewUser } = await this.authService.oauthLogin(profile);

      // Create session in Redis
      const deviceFingerprint = req.headers['user-agent'] || '';
      const ipAddress = (req.ip || req.socket.remoteAddress) || '';

      await sessionService.createSession({
        userId: String(user.id),
        deviceName: req.headers['x-device-name'] as string || 'OAuth Device',
        deviceFingerprint,
        ipAddress,
        userAgent: req.headers['user-agent'] || '',
        metadata: {
          provider: profile.provider,
          isNewUser,
        },
      });

      // Redirect to frontend with tokens
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}&isNewUser=${isNewUser}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('OAuth callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error`);
    }
  }

  // Refresh access token
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token is required',
        });
        return;
      }

      const tokens = await this.authService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        data: { tokens },
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
      });
    }
  }

  // Logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }

  // Get current user
  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user as any;

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          },
        },
      });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get user',
      });
    }
  }
}
