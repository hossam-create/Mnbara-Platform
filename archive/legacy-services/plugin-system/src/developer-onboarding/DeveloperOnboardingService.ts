// ============================================================
// Developer Onboarding Service - Core functionality for Phase 3
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { CustomError } from '../utils/error-handler';

export interface DeveloperRegistration {
  email: string;
  username: string;
  password: string;
  fullName: string;
  company?: string;
  website?: string;
  githubUsername?: string;
  bio?: string;
}

export interface DeveloperProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  company?: string;
  website?: string;
  githubUsername?: string;
  bio?: string;
  verified: boolean;
  apiKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeveloperStats {
  totalPlugins: number;
  activePlugins: number;
  totalDownloads: number;
  averageRating: number;
  totalReviews: number;
}

export class DeveloperOnboardingService {
  private prisma: PrismaClient;
  private logger: Logger;
  private jwtSecret: string;

  constructor(prisma: PrismaClient, logger: Logger) {
    this.prisma = prisma;
    this.logger = logger;
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
  }

  /**
   * Register a new developer
   */
  async registerDeveloper(registration: DeveloperRegistration): Promise<{ developer: DeveloperProfile; token: string }> {
    try {
      // Validate input
      this.validateRegistration(registration);

      // Check if email already exists
      const existingEmail = await this.prisma.developer.findUnique({
        where: { email: registration.email }
      });

      if (existingEmail) {
        throw new CustomError('Email already registered', 409);
      }

      // Check if username already exists
      const existingUsername = await this.prisma.developer.findUnique({
        where: { username: registration.username }
      });

      if (existingUsername) {
        throw new CustomError('Username already taken', 409);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registration.password, 12);

      // Generate API key
      const apiKey = this.generateApiKey();

      // Create developer
      const developer = await this.prisma.developer.create({
        data: {
          id: uuidv4(),
          email: registration.email,
          username: registration.username,
          password: hashedPassword,
          fullName: registration.fullName,
          company: registration.company,
          website: registration.website,
          githubUsername: registration.githubUsername,
          bio: registration.bio,
          verified: false,
          apiKey,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Generate JWT token
      const token = this.generateToken(developer.id, developer.email, ['developer']);

      this.logger.info(`Developer registered: ${developer.email}`);

      return {
        developer: this.mapToDeveloperProfile(developer),
        token
      };
    } catch (error) {
      this.logger.error('Failed to register developer', error);
      throw error;
    }
  }

  /**
   * Authenticate developer
   */
  async authenticateDeveloper(email: string, password: string): Promise<{ developer: DeveloperProfile; token: string }> {
    try {
      // Find developer
      const developer = await this.prisma.developer.findUnique({
        where: { email }
      });

      if (!developer) {
        throw new CustomError('Invalid credentials', 401);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, developer.password);
      if (!isValidPassword) {
        throw new CustomError('Invalid credentials', 401);
      }

      // Generate token
      const token = this.generateToken(developer.id, developer.email, ['developer']);

      this.logger.info(`Developer authenticated: ${developer.email}`);

      return {
        developer: this.mapToDeveloperProfile(developer),
        token
      };
    } catch (error) {
      this.logger.error('Failed to authenticate developer', error);
      throw error;
    }
  }

  /**
   * Get developer profile
   */
  async getDeveloperProfile(developerId: string): Promise<DeveloperProfile> {
    try {
      const developer = await this.prisma.developer.findUnique({
        where: { id: developerId }
      });

      if (!developer) {
        throw new CustomError('Developer not found', 404);
      }

      return this.mapToDeveloperProfile(developer);
    } catch (error) {
      this.logger.error('Failed to get developer profile', error);
      throw error;
    }
  }

  /**
   * Update developer profile
   */
  async updateDeveloperProfile(developerId: string, updates: Partial<DeveloperProfile>): Promise<DeveloperProfile> {
    try {
      const developer = await this.prisma.developer.update({
        where: { id: developerId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      this.logger.info(`Developer profile updated: ${developer.email}`);

      return this.mapToDeveloperProfile(developer);
    } catch (error) {
      this.logger.error('Failed to update developer profile', error);
      throw error;
    }
  }

  /**
   * Get developer stats
   */
  async getDeveloperStats(developerId: string): Promise<DeveloperStats> {
    try {
      const stats = await this.prisma.plugin.aggregate({
        where: { developerId },
        _count: {
          id: true
        },
        _sum: {
          downloadCount: true
        },
        _avg: {
          rating: true
        }
      });

      const activePlugins = await this.prisma.plugin.count({
        where: { 
          developerId,
          status: 'ACTIVE'
        }
      });

      const totalReviews = await this.prisma.pluginReview.count({
        where: {
          plugin: {
            developerId
          }
        }
      });

      return {
        totalPlugins: stats._count.id || 0,
        activePlugins,
        totalDownloads: stats._sum.downloadCount || 0,
        averageRating: stats._avg.rating || 0,
        totalReviews
      };
    } catch (error) {
      this.logger.error('Failed to get developer stats', error);
      throw error;
    }
  }

  /**
   * Generate new API key
   */
  async regenerateApiKey(developerId: string): Promise<string> {
    try {
      const newApiKey = this.generateApiKey();

      const developer = await this.prisma.developer.update({
        where: { id: developerId },
        data: {
          apiKey: newApiKey,
          updatedAt: new Date()
        }
      });

      this.logger.info(`API key regenerated for developer: ${developer.email}`);

      return newApiKey;
    } catch (error) {
      this.logger.error('Failed to regenerate API key', error);
      throw error;
    }
  }

  /**
   * Verify API key
   */
  async verifyApiKey(apiKey: string): Promise<DeveloperProfile | null> {
    try {
      const developer = await this.prisma.developer.findUnique({
        where: { apiKey }
      });

      return developer ? this.mapToDeveloperProfile(developer) : null;
    } catch (error) {
      this.logger.error('Failed to verify API key', error);
      return null;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(developerId: string): Promise<void> {
    try {
      const developer = await this.prisma.developer.findUnique({
        where: { id: developerId }
      });

      if (!developer) {
        throw new CustomError('Developer not found', 404);
      }

      // Generate verification token
      const verificationToken = jwt.sign(
        { developerId: developer.id, type: 'email-verification' },
        this.jwtSecret,
        { expiresIn: '24h' }
      );

      // Store verification token
      await this.prisma.developer.update({
        where: { id: developerId },
        data: {
          verificationToken,
          updatedAt: new Date()
        }
      });

      // TODO: Send email via notification service
      this.logger.info(`Verification email sent to: ${developer.email}`);
    } catch (error) {
      this.logger.error('Failed to send verification email', error);
      throw error;
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as any;

      if (decoded.type !== 'email-verification') {
        throw new CustomError('Invalid token type', 400);
      }

      const developer = await this.prisma.developer.update({
        where: { 
          id: decoded.developerId,
          verificationToken: token
        },
        data: {
          verified: true,
          verificationToken: null,
          updatedAt: new Date()
        }
      });

      this.logger.info(`Email verified for developer: ${developer.email}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to verify email', error);
      return false;
    }
  }

  private validateRegistration(registration: DeveloperRegistration): void {
    if (!registration.email || !registration.email.includes('@')) {
      throw new CustomError('Valid email required', 400);
    }

    if (!registration.username || registration.username.length < 3) {
      throw new CustomError('Username must be at least 3 characters', 400);
    }

    if (!registration.password || registration.password.length < 8) {
      throw new CustomError('Password must be at least 8 characters', 400);
    }

    if (!registration.fullName || registration.fullName.length < 2) {
      throw new CustomError('Full name required', 400);
    }
  }

  private generateToken(userId: string, email: string, roles: string[]): string {
    return jwt.sign(
      { id: userId, email, roles },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  private generateApiKey(): string {
    return `mnbara_dev_${uuidv4().replace(/-/g, '')}`;
  }

  private mapToDeveloperProfile(developer: any): DeveloperProfile {
    return {
      id: developer.id,
      email: developer.email,
      username: developer.username,
      fullName: developer.fullName,
      company: developer.company,
      website: developer.website,
      githubUsername: developer.githubUsername,
      bio: developer.bio,
      verified: developer.verified,
      apiKey: developer.apiKey,
      createdAt: developer.createdAt,
      updatedAt: developer.updatedAt
    };
  }
}