import { AuthService } from '../auth.service';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    oAuthAccount: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;

  beforeEach(() => {
    authService = new AuthService();
    mockPrisma = (authService as any).prisma;
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: userData.email,
        name: userData.name,
        role: 'USER',
        status: 'ACTIVE',
      });

      const user = await authService.register(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('User already exists');
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: 'USER',
      } as any;

      const tokens = authService.generateTokens(user);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        role: 'USER',
      } as any;

      const tokens = authService.generateTokens(user);
      const payload = authService.verifyAccessToken(tokens.accessToken);

      expect(payload.userId).toBe(user.id);
      expect(payload.email).toBe(user.email);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyAccessToken('invalid-token');
      }).toThrow();
    });
  });

  describe('oauthLogin', () => {
    it('should create new user for new OAuth profile', async () => {
      const profile = {
        id: 'google-123',
        email: 'oauth@example.com',
        name: 'OAuth User',
        provider: 'GOOGLE' as const,
      };

      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: '1',
        email: profile.email,
        name: profile.name,
        role: 'USER',
        status: 'ACTIVE',
      });
      mockPrisma.refreshToken.create.mockResolvedValue({});
      mockPrisma.user.update.mockResolvedValue({});

      const result = await authService.oauthLogin(profile);

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.isNewUser).toBe(true);
    });
  });
});
