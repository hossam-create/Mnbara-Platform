import { PrismaClient, User, OAuthProvider } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt.config';
import { logger } from '../utils/logger';
import { JWTPayload, TokenPair, OAuthProfile, RegisterDto, LoginDto } from '../types/auth.types';

export class AuthService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Generate JWT tokens
  generateTokens(user: User): TokenPair {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, jwtConfig.accessTokenSecret, {
      expiresIn: jwtConfig.accessTokenExpiry,
    });

    const refreshToken = jwt.sign(payload, jwtConfig.refreshTokenSecret, {
      expiresIn: jwtConfig.refreshTokenExpiry,
    });

    return { accessToken, refreshToken };
  }

  // Verify JWT token
  verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, jwtConfig.accessTokenSecret) as JWTPayload;
  }

  verifyRefreshToken(token: string): JWTPayload {
    return jwt.verify(token, jwtConfig.refreshTokenSecret) as JWTPayload;
  }

  // Register with email/password
  async register(data: RegisterDto): Promise<User> {
    logger.info(`Registering user: ${data.email}`);

    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    logger.info(`User registered: ${user.id}`);
    return user;
  }

  // Login with email/password
  async login(data: LoginDto): Promise<{ user: User; tokens: TokenPair }> {
    logger.info(`Login attempt: ${data.email}`);

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    // Check status
    if (user.status !== 'ACTIVE') {
      throw new Error('Account is not active');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    logger.info(`User logged in: ${user.id}`);
    return { user, tokens };
  }

  // OAuth login/register
  async oauthLogin(profile: OAuthProfile): Promise<{ user: User; tokens: TokenPair; isNewUser: boolean }> {
    logger.info(`OAuth login: ${profile.provider} - ${profile.email}`);

    // Check if OAuth account exists
    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerId: {
          provider: profile.provider,
          providerId: profile.id,
        },
      },
      include: { user: true },
    });

    let user: User;
    let isNewUser = false;

    if (oauthAccount) {
      // Existing OAuth account
      user = oauthAccount.user;
      logger.info(`Existing OAuth user: ${user.id}`);
    } else {
      // Check if user exists by email
      user = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (user) {
        // Link OAuth account to existing user
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: profile.provider,
            providerId: profile.id,
            profile: profile as any,
          },
        });
        logger.info(`Linked OAuth account to existing user: ${user.id}`);
      } else {
        // Create new user
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            name: profile.name,
            avatar: profile.avatar,
            emailVerified: true,
            oauthAccounts: {
              create: {
                provider: profile.provider,
                providerId: profile.id,
                profile: profile as any,
              },
            },
          },
        });
        isNewUser = true;
        logger.info(`Created new OAuth user: ${user.id}`);
      }
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return { user, tokens, isNewUser };
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    logger.info('Refreshing access token');

    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Check if refresh token exists in DB
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new Error('Refresh token expired');
    }

    // Generate new tokens
    const tokens = this.generateTokens(storedToken.user);

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Store new refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId: storedToken.user.id,
        token: tokens.refreshToken,
        expiresAt,
      },
    });

    logger.info(`Access token refreshed for user: ${storedToken.user.id}`);
    return tokens;
  }

  // Logout
  async logout(refreshToken: string): Promise<void> {
    logger.info('Logging out user');

    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    logger.info('User logged out');
  }

  // Get user by ID
  async getUserById(userId: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
