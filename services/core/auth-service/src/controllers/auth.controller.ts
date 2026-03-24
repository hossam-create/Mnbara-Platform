import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../utils/logger';
import { RegisterDto, LoginDto } from '../types/auth.types';

export class AuthController {
  private service: AuthService;

  constructor() {
    this.service = new AuthService();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = req.body as RegisterDto;

      if (!email || !password || !name) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password, name'
        });
        return;
      }

      const user = await this.service.register({ email, password, name });

      res.status(201).json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Error registering user:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed'
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as LoginDto;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: email, password'
        });
        return;
      }

      const user = await this.service.login({ email, password });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      // In production, generate JWT tokens here
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
          accessToken: 'jwt-token-here',
          refreshToken: 'refresh-token-here'
        }
      });
    } catch (error) {
      logger.error('Error logging in:', error);
      res.status(500).json({
        success: false,
        error: 'Login failed'
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const user = await this.service.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId; // From auth middleware

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      const user = await this.service.updateUser(userId, req.body);

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // In production, revoke refresh token here
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Error logging out:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }
}
